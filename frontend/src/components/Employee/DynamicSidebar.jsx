import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/employee-sidebar.css';

const DynamicSidebar = ({ navigation, userInfo }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout API fails, still navigate to login
      navigate('/login');
    }
  };

  const getIconClass = (iconName) => {
    const iconMap = {
      dashboard: 'fas fa-tachometer-alt',
      bookings: 'fas fa-calendar-check',
      add: 'fas fa-plus-circle',
      search: 'fas fa-search',
      payment: 'fas fa-credit-card',
      report: 'fas fa-chart-line',
      balance: 'fas fa-balance-scale',
      people: 'fas fa-users',
      calendar: 'fas fa-calendar-alt',
      support: 'fas fa-headset',
      book: 'fas fa-book',
      business: 'fas fa-building',
      megaphone: 'fas fa-bullhorn',
      chart: 'fas fa-chart-bar',
      money: 'fas fa-dollar-sign',
      trending: 'fas fa-chart-line',
      settings: 'fas fa-cog'
    };
    return iconMap[iconName] || 'fas fa-circle';
  };

  return (
    <div className="employee-sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {userInfo?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <h4>{userInfo?.name}</h4>
            <p>{userInfo?.designation}</p>
            <span className="department-badge">{userInfo?.department}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul>
          {navigation?.map((item, index) => (
            <li key={index}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
              >
                <i className={getIconClass(item.icon)}></i>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <button onClick={handleLogout} className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default DynamicSidebar;