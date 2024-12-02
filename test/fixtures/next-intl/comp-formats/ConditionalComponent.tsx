import React from 'react';

export const ConditionalComponent = ({ isLoggedIn }) => {
  if (isLoggedIn) {
    return <h1>Welcome Back</h1>;
  }
  return <h1>Please Log In</h1>;
};
