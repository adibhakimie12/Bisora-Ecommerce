import { activityItems } from '../data';

export function ActivityFeed() {
  return (
    <section className="rounded border border-outline-variant/20 bg-surface-lowest p-5">
      <h2 className="text-lg font-semibold text-on-surface">Recent Activity</h2>
      <ol className="mt-5 space-y-5">
        {activityItems.map((item) => (
          <li key={item.id} className="border-l-2 border-primary/30 pl-4">
            {item.href ? (
              <a className="text-sm font-medium text-primary hover:underline" href={item.href}>
                {item.title}
              </a>
            ) : (
              <p className="text-sm font-medium text-on-surface">{item.title}</p>
            )}
            <p className="mt-1 text-xs text-on-surface-variant">{item.time}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
