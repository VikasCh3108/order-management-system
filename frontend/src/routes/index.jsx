import Dashboard from '../pages/Dashboard/Dashboard';
import Products from '../pages/Products/Products';
import Customers from '../pages/Customers/Customers';
import Orders from '../pages/Orders/Orders';
import OrderDetails from '../pages/OrderDetails/OrderDetails';

const routes = [
  {
    path: '/',
    component: Dashboard,
  },
  {
    path: '/products',
    component: Products,
  },
  {
    path: '/customers',
    component: Customers,
  },
  {
    path: '/orders',
    component: Orders,
  },
  {
    path: '/orders/:id',
    component: OrderDetails,
  },
];

export default routes;
