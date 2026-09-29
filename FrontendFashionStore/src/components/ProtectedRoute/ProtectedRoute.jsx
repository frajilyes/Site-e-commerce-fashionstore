import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { setRedirectTo } from "../../pages/Auth/authSlice";
import { getToken } from "../../utils/storage";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { isAuthenticated, user, isSessionChecked } = useSelector(
    (state) => state.auth,
  );

  const target = `${location.pathname}${location.search}`;

  useEffect(() => {
    if (!isAuthenticated) dispatch(setRedirectTo(target));
  }, [dispatch, isAuthenticated, target]);

  if (!isAuthenticated && getToken() && !isSessionChecked) {
    return (
      <div style={{ padding: "6rem 2rem", textAlign: "center", color: "#888" }}>
        Vérification de la session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: target }} replace />;
  }

  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
