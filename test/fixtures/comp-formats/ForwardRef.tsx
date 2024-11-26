import React from 'react';

export const SignOutForm = React.forwardRef<HTMLFormElement>((props, ref) => (
  <Form
    className="w-full"
    ref={ref}
    action={async () => {
      'use server';

      await signOut({
        redirectTo: '/',
      });
    }}
  >
    <button type="submit" className="w-full text-left px-1 py-0.5 text-red-500">
      Sign out
    </button>
  </Form>
));
