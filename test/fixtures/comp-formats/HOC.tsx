export const withWrapper = (Component: React.ComponentType) => {
  return () => (
    <div>
      <Component />
    </div>
  );
};

const SignOutFormBase = () => (
  <Form
    className="w-full"
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
);

export const SignOutForm = withWrapper(SignOutFormBase);
