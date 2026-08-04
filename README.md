# ITU-Compliant Listening Room Geometry & Splay Analyzer

An interactive web application and Python framework designed to systematically transform standardized rectangular room ratios into symmetric double-sided splayed geometries while preserving ITU-R BS.1116 dimensional constraints.

![App Interface](https://controlledsplay.vercel.app/og-image.png) <!-- Varsa arayüzden bir ekran görüntüsü linki -->

## 1. Research Motivation
ITU-R BS.1116 defines dimensional recommendations for critical listening rooms and encourages the use of non-parallel walls. However, a computational framework for systematically transforming standardized rectangular room ratios into symmetric double-sided splayed geometries has not been established. 

This project presents a computational framework for generating symmetric double-sided splayed listening-room geometries while preserving the dimensional constraints defined by ITU-R BS.1116.

## 2. Current Implementation & Scope
- **Geometric Transformation:** Symmetric double-sided wall splaying with ITU-R BS.1116 boundary compliance.
- **Analytical Calculations:** Rayleigh modal-frequency predictions for rapid candidate room evaluations.
- **Finite Element Analysis (FEA):** Python-based automated 2D/3D FEM mesh generation and modal analysis using `scikit-fem`.
- **Validation:** Direct comparison between analytical Rayleigh predictions and numerical FEM results.

## 4. Tech Stack & Dependencies
* **Frontend:** React, Tailwind CSS (Hosted on Vercel)
* **Computational Core:** Python 3.9+, `scikit-fem`, `NumPy`, `SciPy`

## 5. Live Demo
Explore the interactive web tool at: [controlledsplay.vercel.app](https://controlledsplay.vercel.app/)
