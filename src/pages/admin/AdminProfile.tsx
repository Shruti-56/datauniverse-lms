import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  User, 
  Mail, 
  Shield,
  DollarSign,
  Percent,
  BarChart3,
  LogOut,
  Save
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const AdminProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Platform settings state (simulated)
  const [settings, setSettings] = useState({
    discountEnabled: true,
    discountPercent: 25,
    analyticsEnabled: true,
    defaultCoursePrice: 99.99
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleSaveSettings = async () => {
    // Note: Platform settings API endpoint to be implemented in future
    // For now, settings are stored locally in component state
    try {
      // Future: await api.put('/admin/settings', settings);
      toast({
        title: "Settings Saved",
        description: "Your platform settings have been updated. (Local storage - API integration pending)"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Profile Header */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="h-32 gradient-hero" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="w-24 h-24 rounded-xl bg-card border-4 border-card flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {user?.fullName || 'Admin User'}
              </h1>
              <p className="text-muted-foreground">Platform Administrator</p>
            </div>
            <Button variant="destructive" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-4">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Full Name</p>
              <p className="text-sm font-medium text-foreground">{user?.fullName || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-sm font-medium text-foreground capitalize">
                {user?.roles?.includes('ADMIN') ? 'Admin' : 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-card rounded-xl border border-border p-6 shadow-card">
        <h2 className="text-lg font-semibold text-foreground mb-6">Platform Settings</h2>
        
        <div className="space-y-6">
          {/* Pricing Settings */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Pricing Settings
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">
                  Default Course Price (₹)
                </label>
                <input
                  type="number"
                  value={settings.defaultCoursePrice}
                  onChange={(e) => setSettings(s => ({ ...s, defaultCoursePrice: parseFloat(e.target.value) }))}
                  className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Discount Settings */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-accent" />
              Discount Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Enable Discounts</p>
                  <p className="text-sm text-muted-foreground">Show discounted prices on courses</p>
                </div>
                <Switch 
                  checked={settings.discountEnabled}
                  onCheckedChange={(checked) => setSettings(s => ({ ...s, discountEnabled: checked }))}
                />
              </div>
              {settings.discountEnabled && (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={settings.discountPercent}
                    onChange={(e) => setSettings(s => ({ ...s, discountPercent: parseInt(e.target.value) }))}
                    min={0}
                    max={100}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Analytics Settings */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-success" />
              Analytics Settings
            </h3>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-foreground">Analytics Access</p>
                <p className="text-sm text-muted-foreground">Enable platform analytics dashboard</p>
              </div>
              <Switch 
                checked={settings.analyticsEnabled}
                onCheckedChange={(checked) => setSettings(s => ({ ...s, analyticsEnabled: checked }))}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 mt-6 border-t border-border">
          <Button onClick={handleSaveSettings} className="gap-2">
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
