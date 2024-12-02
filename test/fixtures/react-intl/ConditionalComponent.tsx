export function ConditionalComponent({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div>
      {isLoggedIn ? (
        <h1>Welcome back!</h1>
      ) : (
        <div>
          <h1>Please log in</h1>
          <p>You need to be logged in to view this content</p>
        </div>
      )}
      <button title="Click to continue">Continue</button>
    </div>
  );
}
