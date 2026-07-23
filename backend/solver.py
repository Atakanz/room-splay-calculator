import os
os.environ["PYTHONWARNINGS"] = "ignore"
os.environ.setdefault("OMP_NUM_THREADS", "4")
os.environ.setdefault("MKL_NUM_THREADS", "4")

import sys
import json
import numpy as np
from scipy.sparse.linalg import eigsh
from skfem import MeshTet, ElementTetP2, InteriorBasis, BilinearForm, asm
from scipy.sparse.linalg import LinearOperator

try:
    from sksparse.cholmod import cholesky
    CHOLMOD_AVAILABLE = True
except Exception:
    CHOLMOD_AVAILABLE = False

C = 343.0  # Ses hizi (m/s)

@BilinearForm
def stiffness_form(u, v, w):
    return (u.grad[0] * v.grad[0] +
            u.grad[1] * v.grad[1] +
            u.grad[2] * v.grad[2])

@BilinearForm
def mass_form(u, v, w):
    return u * v

def generate_optimized_mesh(length, height, w_min, w_max):
    h_x = 0.3
    h_y = 0.3
    h_z = 0.4

    nx = max(3, int(np.ceil(length / h_x)))
    ny = max(3, int(np.ceil(w_max / h_y)))
    nz = max(2, int(np.ceil(height / h_z)))

    dx = length / nx
    dy = w_max / ny
    dz = height / nz

    mesh = MeshTet.init_tensor(
        np.linspace(0, 1, int(round(length / dx)) + 1),
        np.linspace(0, 1, int(round(w_max / dy)) + 1),
        np.linspace(0, 1, int(round(height / dz)) + 1)
    )

    p = mesh.p.copy()
    x = p[0] * length
    z = p[2] * height
    w_x = w_min + (w_max - w_min) * p[0]
    y = p[1] * w_x

    transformed_points = np.vstack([x, y, z])
    return MeshTet(transformed_points, mesh.t)

def _solve_with_superlu(K, M, k_modes, sigma):
    """SciPy eigsh (ARPACK) + Fallback Shift-Invert solver."""
    eigenvalues, _ = eigsh(
        K, M=M,
        k=k_modes,
        sigma=sigma,
        which='LM',
        tol=1e-3,
        maxiter=2000
    )
    return eigenvalues

def calculate_3d_modes(lengthMean, currentHeight, wMin, wMax):
    try:
        mesh = generate_optimized_mesh(lengthMean, currentHeight, wMin, wMax)

        element = ElementTetP2()
        basis = InteriorBasis(mesh, element)

        K = asm(stiffness_form, basis).tocsc()
        M = asm(mass_form, basis).tocsc()

        num_dofs = K.shape[0]
        if num_dofs <= 3:
            return []

        # k_modes sayısını matris boyutunu aşmayacak şekilde güvenli limite çek
        k_modes = min(30, max(2, num_dofs - 3)) 
        sigma = 0.01

        eigenvalues = None
        if CHOLMOD_AVAILABLE:
            try:
                A = (K - sigma * M).tocsc()
                factor = cholesky(A)
                OPinv = LinearOperator(shape=A.shape, matvec=factor, dtype=A.dtype)
                eigenvalues, _ = eigsh(K, M=M, k=k_modes, sigma=sigma, which="LM", OPinv=OPinv, tol=1e-3, maxiter=1000)
            except Exception:
                eigenvalues = _solve_with_superlu(K, M, k_modes, sigma)
        else:
            eigenvalues = _solve_with_superlu(K, M, k_modes, sigma)

        frequencies = []
        for val in eigenvalues:
            real_val = float(val)
            if real_val > 0.05:
                k_val = np.sqrt(real_val)
                freq = (k_val * C) / (2 * np.pi)
                frequencies.append(round(freq, 2))

        frequencies.sort()
        return frequencies[:50]

    except Exception as e:
        print(f"FEM Error: {str(e)}", file=sys.stderr)
        raise e


if __name__ == "__main__":
    try:
        if len(sys.argv) < 5:
            raise ValueError("Eksik parametre gönderildi.")

        lengthMean = float(sys.argv[1])
        currentHeight = float(sys.argv[2])
        wMin = float(sys.argv[3])
        wMax = float(sys.argv[4])

        freq_list = calculate_3d_modes(lengthMean, currentHeight, wMin, wMax)

        print(json.dumps({"frequencies": freq_list}))
        sys.stdout.flush()

        print(f"CHOLMOD: {CHOLMOD_AVAILABLE}", file=sys.stderr)
        sys.stderr.flush()

    except Exception as e:
        print(json.dumps({"frequencies": [], "error": str(e)}))
        sys.stdout.flush()
        sys.exit(0)