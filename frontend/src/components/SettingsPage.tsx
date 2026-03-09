import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { useAuth } from "../contexts/AuthContext";
import { useActivityLogs, type ActivityLog } from "../hooks/useFiles";
import { User, Shield, HardDrive, Github, Trash2, Loader2, Upload, Download, FolderPlus, FileText, LogIn } from "lucide-react";

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleString();
};

const getActionIcon = (action: string) => {
  switch (action) {
    case "file_upload":
    case "file_upload_chunked":
      return <Upload className="w-4 h-4 text-green-500" />;
    case "file_download":
      return <Download className="w-4 h-4 text-blue-500" />;
    case "folder_create":
      return <FolderPlus className="w-4 h-4 text-yellow-500" />;
    case "file_delete":
    case "folder_delete":
      return <Trash2 className="w-4 h-4 text-red-500" />;
    case "login":
    case "oauth_login":
      return <LogIn className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case "file_upload":
      return "Uploaded file";
    case "file_upload_chunked":
      return "Uploaded file (chunked)";
    case "file_download":
      return "Downloaded file";
    case "file_delete":
      return "Deleted file";
    case "file_restore":
      return "Restored file";
    case "folder_create":
      return "Created folder";
    case "folder_delete":
      return "Deleted folder";
    case "folder_rename":
      return "Renamed folder";
    case "login":
      return "Logged in";
    case "oauth_login":
      return "Logged in with OAuth";
    case "logout":
      return "Logged out";
    default:
      return action;
  }
};

export function SettingsPage() {
  const { user, logout } = useAuth();
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { data: logsData } = useActivityLogs(20);
  const logs = logsData?.logs || [];

  const storageUsed = 1024 * 1024 * 100;
  const storageQuota = 1024 * 1024 * 1024 * 10;
  const usagePercent = (storageUsed / storageQuota) * 100;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const handleChangePassword = async (e: Event) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setChangingPassword(true);

    try {
      setSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profile
            </CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Email</label>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-muted-foreground">{user?.name || "Not set"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Storage
            </CardTitle>
            <CardDescription>Monitor your storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Usage</span>
                <span>
                  {formatBytes(storageUsed)} / {formatBytes(storageQuota)}
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatBytes(storageQuota - storageUsed)} remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your password and security settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              {success && (
                <div className="rounded-md bg-green-50 p-4">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
              )}
              <div>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onInput={(e) => setCurrentPassword((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onInput={(e) => setNewPassword((e.target as HTMLInputElement).value)}
                />
              </div>
              <Button type="submit" disabled={changingPassword}>
                {changingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="w-5 h-5" />
              Connected Accounts
            </CardTitle>
            <CardDescription>Manage your OAuth connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Github className="w-5 h-5" />
                <span>GitHub</span>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Activity Log
            </CardTitle>
            <CardDescription>Recent account activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                logs.map((log: ActivityLog) => (
                  <div
                    key={log.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    {getActionIcon(log.action)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {getActionLabel(log.action)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.metadata?.filename || log.metadata?.name || ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.timestamp)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button variant="destructive" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
