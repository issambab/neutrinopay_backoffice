import { Card, CardContent } from "@/components/ui/card";

export function MerchantEmptyState({ text }: { text: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground text-sm">{text}</CardContent>
    </Card>
  );
}
