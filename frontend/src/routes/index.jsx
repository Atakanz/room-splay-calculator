import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import AboutProject from '../pages/aboutProject';
import Calculator from '../pages/calculator';
export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { path: "/", element: <AboutProject /> },
            { path: "/calculator", element: <Calculator /> },
        ]
    },
]);