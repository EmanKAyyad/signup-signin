import styles from './Dashboard.module.scss';
import logo from '../../assets/logo.png';
import { useAuth } from '../../providers/authContext';
import welcomeImg from '../../assets/welcome.png';

export const Dashboard = () => {
  const { logout } = useAuth();
  return (
    <>
      <div className="container text-center">
        <div className={styles.header}>
          <img src={logo} alt="" />
          <button className="btn btn-link" onClick={logout}>
            Logout
          </button>
        </div>
        <div className="w-100">
          <img src={welcomeImg} alt="welcome" />
        </div>
      </div>
    </>
  );
};
