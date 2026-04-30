import Text from '../components/Text'
import { NavLink } from 'react-router'
import Box from '../components/Box'
import { jwtDecode } from "jwt-decode"
import logo from '../assets/personal-tech-logo-blanco.svg'
import ciscoLogo from '../assets/logocisco.svg'

import { useNavigate } from 'react-router';

function Navbar() {
    const navigate = useNavigate();
    let username = "";
    let role = ""; 

    try {
        const token = localStorage.getItem('jwt_token')
        if (token) {
            //console.log("token token->", token)
            const decoded = jwtDecode(token)
            //console.log("token data->", decoded)
            username = decoded.username
            role = decoded.role
        }   
    }catch (error) {
        console.error("Error decodificando token", error.message)
    }

  return (
       <Box className="navbar__container" >
      {/* izquierda — logo Cisco */}
      <div className='d-flex align-center'>
            <img src={ciscoLogo} alt="Cisco Meraki" className="login-cisco pr-2" />
            <div className="mds-header-branding-name pl-2"><a target='_blank' href="https://n356.dashboard.meraki.com/o/3Dn5zb/manage/dashboard">Meraki</a></div>
      </div>

      {/* centro — logo, absolutamente centrado */}
            <NavLink to="/" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <img src={logo} alt="logo" className="navbar__logo" />
            </NavLink>

            <Box as="nav">

          
                <NavLink to="/reports/vpn" >VPN Status</NavLink>
                {/* Reports dropdown — históricos y acumulados */}
                <div className="navbar__dropdown">
                  <button className="navbar__dropdown-trigger">
                    Reports
                    <span className="navbar__dropdown-arrow">▼</span>
                  </button>
                  <div className="navbar__dropdown-menu">
                    {/*<NavLink to="/reports/incidents">Inc Mgmnt</NavLink>*/}
                    <NavLink to="/reports/vpn-events">VPN Event Log</NavLink>
                    <NavLink to="/portal">Customer Portal</NavLink>
                    {role === 'admin' && (
                      <NavLink to="/reports/CUEstadisticas">CUEstadisticas</NavLink>
                    )}
                  </div>
                </div>



                <NavLink to="/Contacto" ></NavLink>

                <NavLink>
                    <Box>
                        <Text as="span" style={ {fontSize: '0.7rem', color: '#fff'}}    >

                            User: <strong>{username}</strong> | Rol: <strong>{role}</strong> 
                        </Text>
                    </Box>     
                </NavLink>
                <NavLink onClick={() => {
                    localStorage.removeItem('jwt_token');
                    localStorage.setItem('logout_reason', 'manual');
                   // window.location.href = '/login'
                     navigate('/login');  // ← sin recarga de página
                }}>

                    <Text as="span" style={{ fontSize: '0.9rem', color: '#fff'}}>Logout</Text>
                </NavLink>
            </Box>
            
        </Box>
    
  )
}

export default Navbar