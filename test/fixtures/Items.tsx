export function Items() {
  const {
    data: items,
    isLoading,
    mutate,
  } = useSWR<Array<Item>>('/api/items', fetcher, {
    fallbackData: [],
  });

  if (isLoading || !items) {
    return <div>Loading...</div>;
  }

  const groups = groupItemsByPlace(items);

  return (
    <div>
      <h2 className="font-bold mb-2">{items.length} Items</h2>
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
