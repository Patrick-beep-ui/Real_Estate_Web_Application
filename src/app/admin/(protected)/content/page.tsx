import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LandingPagesTab } from "@/components/admin/content-studio/LandingPagesTab";
import { SmsTemplatesTab } from "@/components/admin/content-studio/SmsTemplatesTab";
import { EmailTemplatesTab } from "@/components/admin/content-studio/EmailTemplatesTab";
import PerformanceLoopTab from "@/components/admin/content-studio/PerformanceLoopTab";

const AdminContent = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-powered content generation, performance tracking, and self-improving loop
        </p>
      </div>

      <Tabs defaultValue="landing-pages" className="w-full">
        <TabsList>
          <TabsTrigger value="landing-pages">Landing Pages</TabsTrigger>
          <TabsTrigger value="email-sequences">Email Sequences</TabsTrigger>
          <TabsTrigger value="sms-templates">SMS Templates</TabsTrigger>
          <TabsTrigger value="performance-loop">Performance Loop</TabsTrigger>
        </TabsList>

        <TabsContent value="landing-pages">
          <LandingPagesTab />
        </TabsContent>

        <TabsContent value="email-sequences">
          <EmailTemplatesTab />
        </TabsContent>

        <TabsContent value="sms-templates">
          <SmsTemplatesTab />
        </TabsContent>

        <TabsContent value="performance-loop">
          <PerformanceLoopTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminContent;
