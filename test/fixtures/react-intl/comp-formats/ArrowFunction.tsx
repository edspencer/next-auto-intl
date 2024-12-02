import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

export const ComprehensiveTestComponent = () => {
  const intl = useIntl();
  const dynamicValue = 'Dynamic String'; // For non-static test cases

  return (
    <div>
      {/* Basic static strings */}
      <h1>Welcome to the Test!</h1>
      <p>This is a comprehensive test case.</p>

      {/* Human-facing attributes */}
      <img
        src="/test-image.jpg"
        alt="This is a test image"
        title="Image title here"
      />
      <input
        placeholder="Enter your name"
        aria-label="Name input field"
        aria-labelledby="nameLabel"
      />

      {/* JSX expressions with strings */}
      <span>{'This is inside curly braces.'}</span>
      <span> </span>
      <span>{`,`}</span>
      <span>{`Another tricky string with spaces and punctuation!`}</span>

      {/* Dynamic value */}
      <span>{dynamicValue}</span>

      {/* Random punctuation */}
      <span>{'('}</span>
      <span>{')'}</span>
      <span>{'...'}</span>
      <span>{'!@#$%^&*()'}</span>

      {/* Nested components and strings */}
      <div>
        <p>
          Nested <strong>string inside a tag</strong> for more coverage.
        </p>
      </div>

      {/* Multiple attributes */}
      <a href="/test-link" title="Test Link Title">
        Click here
      </a>

      {/* Already-translated strings */}
      <p title={intl.formatMessage({ id: 'already-translated-title' })}>
        <FormattedMessage id="welcome-to-myapp" />{' '}
      </p>
    </div>
  );
};
