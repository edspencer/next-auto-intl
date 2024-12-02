import { FormattedMessage, useIntl } from 'react-intl';
export function Items() {
  const intl = useIntl();
  const {
    data: items,
    isLoading,
    mutate,
  } = useSWR<Array<Item>>('/api/items', fetcher, {
    fallbackData: [],
  });

  if (isLoading || !items) {
    return (
      <div>
        <FormattedMessage id="loading" />
      </div>
    );
  }

  const groups = groupItemsByPlace(items);

  return (
    <div>
      <h2 className="font-bold mb-2">
        {items.length}
        <FormattedMessage id="items" />
      </h2>
      <ul>
        {Object.entries(groups).map(([place, items]) => (
          <li key={place}>
            <h3 className="font-bold mt-2">
              {place} ({items.length})
            </h3>
            <ul>
              {items.map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
