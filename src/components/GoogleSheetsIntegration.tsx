import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, Download, Upload, ExternalLink, Settings } from 'lucide-react';

interface SheetsIntegration {
  id: string;
  google_sheet_id: string | null;
  sheet_name: string | null;
  sync_enabled: boolean;
  sync_status: string;
  last_sync_at: string | null;
}

interface GoogleSheetsIntegrationProps {
  selectedMonth: string;
}

export const GoogleSheetsIntegration = ({ selectedMonth }: GoogleSheetsIntegrationProps) => {
  const [integration, setIntegration] = useState<SheetsIntegration | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets_integrations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIntegration(data);
    } catch (error: any) {
      console.error('Error fetching integration:', error);
    }
  };

  const handleAuthenticate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-integration?action=auth_url', {
        body: {},
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Open authentication window
        const authWindow = window.open(
          data.authUrl,
          'google-auth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        // Listen for the auth code
        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            handleAuthCode(event.data.code);
            authWindow?.close();
            window.removeEventListener('message', handleMessage);
          }
        };

        window.addEventListener('message', handleMessage);
      }
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthCode = async (code: string) => {
    try {
      const { error } = await supabase.functions.invoke('google-sheets-integration?action=exchange_code', {
        body: { code },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      toast({
        title: 'Authentication Successful',
        description: 'Google Sheets integration is now active.',
      });

      fetchIntegration();
    } catch (error: any) {
      toast({
        title: 'Authentication Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleCreateSheet = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-sheets-integration?action=create_sheet', {
        body: { 
          title: `Business Tracker - ${new Date().getFullYear()}`,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      toast({
        title: 'Spreadsheet Created',
        description: 'Your business tracking spreadsheet is ready!',
      });

      fetchIntegration();
    } catch (error: any) {
      toast({
        title: 'Creation Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (dataType: string) => {
    setExporting(true);
    try {
      const { error } = await supabase.functions.invoke('google-sheets-integration?action=export_data', {
        body: { 
          dataType,
          month: selectedMonth,
        },
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;

      toast({
        title: 'Export Successful',
        description: `${dataType.replace('_', ' ')} data exported to Google Sheets.`,
      });
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      pending: 'secondary',
      error: 'destructive',
      syncing: 'outline'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sheet className="h-5 w-5" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            Export your business data to Google Sheets for analysis and sharing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!integration ? (
            <div className="text-center py-6">
              <Sheet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Connect to Google Sheets</h3>
              <p className="text-muted-foreground mb-4">
                Authenticate with Google to start exporting your business data.
              </p>
              <Button onClick={handleAuthenticate} disabled={loading}>
                {loading ? 'Connecting...' : 'Connect Google Sheets'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Integration Status</h3>
                  <p className="text-sm text-muted-foreground">
                    {integration.sheet_name || 'No spreadsheet linked'}
                  </p>
                </div>
                {getStatusBadge(integration.sync_status)}
              </div>

              {!integration.google_sheet_id ? (
                <Button onClick={handleCreateSheet} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Spreadsheet'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${integration.google_sheet_id}`, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Spreadsheet
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Export Data</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportData('monthly_goals')}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Monthly Goals
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportData('daily_progress')}
                        disabled={exporting}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Daily Progress
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};