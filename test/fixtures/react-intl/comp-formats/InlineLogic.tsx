import React from 'react';

export const InlineLogic = ({ isPremium }) => (
  <div>
    {isPremium ? 'Welcome, Premium User!' : 'Upgrade to Premium'}
    {isPremium && <button>Exclusive Feature</button>}
  </div>
);
