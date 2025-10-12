// src/components/ProtectedRoute.js
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, user, redirectTo = "/login" }) => {
  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

// PropTypes validation
ProtectedRoute.propTypes = {
  children: function(props, propName, componentName) {
    if (props[propName] === undefined || props[propName] === null) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to `' + componentName + 
        '`. Expected React element(s).'
      );
    }
  },
  user: function(props, propName, componentName) {
    const user = props[propName];
    if (user !== null && user !== undefined && (typeof user !== 'object' || !user.email)) {
      return new Error(
        'Invalid prop `' + propName + '` supplied to `' + componentName + 
        '`. Expected null or an object with email property.'
      );
    }
  },
  redirectTo: function(props, propName, componentName) {
    if (props[propName] && typeof props[propName] !== 'string') {
      return new Error(
        'Invalid prop `' + propName + '` of type `' + typeof props[propName] +
        '` supplied to `' + componentName + '`, expected `string`.'
      );
    }
  }
};

export default ProtectedRoute;