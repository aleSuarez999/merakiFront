
import CartProvider from '../context/CartProvider'
import AppRoutes from '../routes/AppRoutes'
import Text from './Text'


function App() {

  return (
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  )
}

export default App
