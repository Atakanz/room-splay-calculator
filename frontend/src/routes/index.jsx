import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AboutProject from '../pages/aboutProject';
import FSICalculatorPage from '../pages/fsiCalculator';
import Calculator from '../pages/calculator';
export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "/", element: <AboutProject /> },
            { path: "/fsi-calculator", element: <FSICalculatorPage /> },
            { path: "/calculator", element: <Calculator /> },
        ]
    },
]);