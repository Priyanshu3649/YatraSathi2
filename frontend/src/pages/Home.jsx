import React from 'react';

const Home = () => {
  return (
    <div className="home panel">
      <h2 className="panel-header">Welcome to YatraSathi</h2>
      <p>Your ultimate travel companion for Tatkal ticket booking.</p>
      
      <div className="features row">
        <div className="feature card col-4">
          <h3 className="card-header">Easy Booking</h3>
          <p>Book your Tatkal tickets with just a few clicks.</p>
        </div>
        <div className="feature card col-4">
          <h3 className="card-header">Real-time Updates</h3>
          <p>Get real-time updates on your booking status.</p>
        </div>
        <div className="feature card col-4">
          <h3 className="card-header">Secure Payments</h3>
          <p>Secure and convenient payment options.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;