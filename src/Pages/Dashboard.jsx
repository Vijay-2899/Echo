import React from 'react';

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold">Welcome, {user?.username}!</h2>
      <p className="mt-4">This is your dashboard.</p>
    </div>
  );
};

export default Dashboard;
