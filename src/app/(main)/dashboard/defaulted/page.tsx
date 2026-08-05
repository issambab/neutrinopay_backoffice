import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { CardOverview } from "./_components/card-overview";
import { recentLeadsData } from "./_components/crm.config";
import { RecentLeadsTable } from "./_components/recent-leads-table/table";

export default function Page() {
  return (
    <div>
      <Tabs className="gap-4" defaultValue="overview">
        <TabsContent value="overview">
          <div className="flex flex-col gap-4 **:data-[slot=card]:shadow-xs">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
              <div className="flex flex-col gap-4">
                <RecentLeadsTable data={recentLeadsData} />
              </div>

              <CardOverview />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
