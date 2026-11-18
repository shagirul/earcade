import { Screen } from "../../ui/layout/Screen";
import { Card } from "../../ui/primitives/Card";

export function PlaceholderScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Screen>
      <div className="pt-8">
        <h1 className="ear-heading text-white">{title}</h1>
        <p className="ear-body text-zinc-400 mt-2">{subtitle}</p>

        <div className="mt-6 space-y-4">
          <Card className="rounded-xl">
            <div className="ear-label mb-2">UI kit note</div>
            <p className="ear-body text-zinc-400">
              This screen is intentionally minimal. Add new features by composing existing primitives:
              Card, KineticButton, MetadataStat, ProgressBar.
            </p>
          </Card>
        </div>
      </div>
    </Screen>
  );
}
