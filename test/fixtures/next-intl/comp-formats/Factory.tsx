export function createSignOutForm() {
  return function SignOutForm() {
    return (
      <Form
        className="w-full"
        action={async () => {
          'use server';

          await signOut({
            redirectTo: '/',
          });
        }}
      >
        <button
          type="submit"
          className="w-full text-left px-1 py-0.5 text-red-500"
        >
          Sign out
        </button>
      </Form>
    );
  };
}

export const SignOutForm = createSignOutForm();
