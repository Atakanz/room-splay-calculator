import { ScaleLoader } from "react-spinners";

export default function Loading() {
    return (
        <div className="fixed inset-0 w-screen h-screen flex items-center justify-center bg-white z-50">
            <ScaleLoader color="#000000" size={50} />
        </div>
    );
}