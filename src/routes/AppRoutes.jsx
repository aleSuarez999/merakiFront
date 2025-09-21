import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from '../layout/Layout'
/*
import Home from '../pages/Home'
import AboutUs from '../pages/AboutUs'
import Upload from '../pages/Upload'
import ContactUs from '../pages/ContactUs'
import Checkout from '../pages/Checkout'
*/
function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index path="/" element={<DashBoard />} />
                    <Route path="/detalle" element={<Details />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes