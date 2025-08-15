import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Sheet, 
  Download, 
  Upload, 
  ExternalLink, 
  Settings, 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Clock, 
  Calendar,
  BarChart3,
  Target,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Info,
  RefreshCw,
  Unlink,
  AlertTriangle
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [exportingType, setExportingType] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const { toast } = useToast();

  // Helper function to get current status
  const getIntegrationStatus = () => {
    if (!integration) return 'not_connected';
    if (integration.sync_status !== 'success') return 'connecting';
    if (!integration.google_sheet_id) return 'authenticated';
    return 'connected';
  };

  useEffect(() => {
    fetchIntegration();
  }, []);

  const fetchIntegration = async () => {
    try {
      const { data, error } = await supabase
        .from('sheets_integrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIntegration(data);
    } catch (error: any) {
      console.error('Error fetching integration:', error);
    }
  };

  const handleConnectAndSetup = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if user already has a spreadsheet
      if (integration?.google_sheet_id) {
        toast({
          title: 'Already Connected',
          description: 'You already have a Google Sheet connected. Use the disconnect option if you want to create a new one.',
          variant: 'destructive',
        });
        return;
      }
      
      // Test the dedicated secret test endpoint (no auth required)
      console.log('Testing Google OAuth secret...');
      const testResponse = await fetch(
        `https://ksyuwacuigshvcyptlhe.supabase.co/functions/v1/test-google-secret`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const testData = await testResponse.json();
      console.log('Secret test result:', testData);
      
      if (!testData.hasSecret) {
        throw new Error('Google OAuth credentials are not configured in Supabase. Please add them in the Edge Functions secrets.');
      }
      
      if (!testData.isValidJson) {
        throw new Error(`Google OAuth credentials are invalid JSON: ${testData.parseError}`);
      }
      
      if (!testData.credentialStructure?.hasWeb) {
        throw new Error('Google OAuth credentials are missing the "web" configuration object.');
      }
      
      if (!testData.credentialStructure?.hasClientId || !testData.credentialStructure?.hasClientSecret) {
        throw new Error('Google OAuth credentials are missing client_id or client_secret.');
      }

      // Get auth URL from backend
      const authResponse = await fetch(
        `https://ksyuwacuigshvcyptlhe.supabase.co/functions/v1/google-sheets-integration?action=auth_url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          }
        }
      );

      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.error || 'Failed to get auth URL');
      }

      const { authUrl } = await authResponse.json();
      
      // Open the auth URL in a popup window
      const popup = window.open(authUrl, 'google-oauth', 'width=600,height=600');
      
      // Listen for OAuth completion messages
      const handleMessage = (event: MessageEvent) => {
        if (event.data.type === 'oauth_success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: 'Success',
            description: 'Google Sheets integration completed! Your business tracking spreadsheet has been created and populated with your data.',
          });
          fetchIntegration(); // Refresh integration status
        } else if (event.data.type === 'oauth_error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: 'Setup Failed',
            description: event.data.error || 'Integration setup failed',
            variant: 'destructive',
          });
        }
      };
      
      window.addEventListener('message', handleMessage);
      
      // Clean up if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `https://ksyuwacuigshvcyptlhe.supabase.co/functions/v1/google-sheets-integration?action=refresh_all_data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Data refresh failed');
      }

      toast({
        title: 'Data Refreshed',
        description: 'Your Google Sheet has been updated with the latest data from your business tracker.',
      });

      // Update last sync time
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('sheets_integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
      
      fetchIntegration();
    } catch (error: any) {
      toast({
        title: 'Refresh Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('sheets_integrations')
          .delete()
          .eq('user_id', user.id);
      }
      
      setIntegration(null);
      setShowDisconnectDialog(false);
      
      toast({
        title: 'Disconnected',
        description: 'Google Sheets integration has been removed. You can reconnect anytime to create a new spreadsheet.',
      });
    } catch (error: any) {
      toast({
        title: 'Disconnect Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const integrationStatus = getIntegrationStatus();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
            Google Sheets Integration
          </CardTitle>
          <CardDescription>
            Export your business data to Google Sheets for analysis and sharing.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Not Connected State */}
          {integrationStatus === 'not_connected' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <Sheet className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Setup Google Sheets Integration</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect with Google and automatically create a comprehensive business tracking spreadsheet with all your data.
              </p>
              <Button onClick={handleConnectAndSetup} disabled={loading} size="lg">
                {loading ? (
                  <>
                    <Circle className="h-4 w-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Sheet className="h-4 w-4 mr-2" />
                    Connect & Create Spreadsheet
                  </>
                )}
              </Button>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800 text-left">
                    <p className="mb-2">This will automatically:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Connect your Google account</li>
                      <li>Create a new spreadsheet in your Google Drive</li>
                      <li>Set up organized sheets for all your business data</li>
                      <li>Populate it with your current tracking data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connecting State */}
          {integrationStatus === 'connecting' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-yellow-50 rounded-full flex items-center justify-center mb-4">
                <Circle className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Setting Up Integration...</h3>
              <p className="text-muted-foreground mb-6">
                Please wait while we complete your Google Sheets setup.
              </p>
            </div>
          )}

          {/* Connected State */}
          {integrationStatus === 'connected' && integration?.google_sheet_id && (
            <div className="space-y-6">
              {/* Status and Quick Actions */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <h3 className="font-medium text-green-900">Google Sheets Connected!</h3>
                    <p className="text-sm text-green-700">
                      {integration.sheet_name || `Business Tracker - ${new Date().getFullYear()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefreshData}
                      disabled={refreshing}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      {refreshing ? (
                        <Circle className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Refresh Data
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${integration.google_sheet_id}`, '_blank')}
                      className="border-green-300 text-green-700 hover:bg-green-100"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Sheet
                    </Button>
                  </div>
                </div>
              </div>

              {/* Last Sync Info and Disconnect */}
              <div className="flex items-center justify-between">
                {integration.last_sync_at ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Last synced: {new Date(integration.last_sync_at).toLocaleDateString()} at {new Date(integration.last_sync_at).toLocaleTimeString()}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Info className="h-4 w-4" />
                    Data automatically populated when connected
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisconnectDialog(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>

              <Separator />

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Your spreadsheet includes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Monthly Goals:</strong> Revenue targets, business objectives, and cost budgets</li>
                      <li><strong>Daily Progress:</strong> Daily tracking of workshops, advisory, lectures, and PR activities</li>
                      <li><strong>Opportunities Pipeline:</strong> Sales opportunities with stages and probabilities</li>
                      <li><strong>Revenue Tracking:</strong> All revenue entries by source and date</li>
                      <li><strong>Summary Dashboard:</strong> Key metrics, charts, and automatic calculations</li>
                    </ul>
                    <p className="mt-3">
                      Use the "Refresh Data" button above to update your spreadsheet with the latest information from your business tracker.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disconnect Confirmation Dialog */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Disconnect Google Sheets?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                This will permanently disconnect your Google Sheets integration and remove all connection data.
              </p>
              <p>
                <strong>Warning:</strong> You will lose the connection to your current spreadsheet. 
                To reconnect later, you'll need to create a completely new spreadsheet.
              </p>
              <p>
                Your existing Google Sheet will remain in your Google Drive, but won't be updated automatically anymore.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Circle className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};