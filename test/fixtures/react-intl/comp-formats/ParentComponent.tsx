import React from 'react';

//it's tempting to translate strings like this, but we can't possibly know if the string
//should be translated or not. We should leave it as is.
export const ParentComponent = () => (
  <div>
    Hello World
    <ChildComponent message="Hello from Parent" />
  </div>
);

const ChildComponent = ({ message }) => <p>{message}</p>;
