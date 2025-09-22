import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from '../layout/Layout'
import DashBoard from '../pages/Dashboard'
import Organization from '../pages/Organization'
import "../styles/main.scss"

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index path="/" element={<DashBoard />} />
                    <Route path="/Organization/:orgId" element={<Organization />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes