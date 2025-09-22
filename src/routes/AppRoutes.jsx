import { BrowserRouter, Route, Routes } from 'react-router'
import Layout from '../layout/Layout'
import DashBoard from '../pages/Dashboard'
import "../styles/main.scss"
import Organization from '../pages/Organization'

function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index path="/" element={<DashBoard />} />
                    <Route path="/organization/:orgId" element={<Organization />} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default AppRoutes