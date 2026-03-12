import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Users, Mail, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

type Instructor = {
  id: string;
  email: string;
  fullName: string;
  studentsCount: number;
  students: Array<{
    id: string;
    email: string;
    profile: { fullName: string | null } | null;
  }>;
  createdAt: string;
};

const VISIBLE_STUDENTS_INLINE = 3;
const EXPANDED_LIST_MAX_HEIGHT = 220;

const AdminInstructors: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedInstructorId, setExpandedInstructorId] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/instructors');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load instructors' }));
        throw new Error(errorData.error || 'Failed to load instructors');
      }

      const data = await response.json();
      setInstructors(Array.isArray(data) ? data : []);
    } catch (error: unknown) {
      console.error('Error fetching instructors:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load instructors',
        variant: 'destructive',
      });
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !fullName) {
      toast({
        title: 'Error',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/admin/instructors', {
        email,
        password: password || 'Instructor123!',
        fullName,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add instructor' }));
        throw new Error(errorData.error || 'Failed to add instructor');
      }

      const responseData = await response.json();
      toast({
        title: 'Success',
        description: responseData.message || 'Instructor added successfully',
      });
      setShowAddDialog(false);
      setEmail('');
      setPassword('');
      setFullName('');
      fetchInstructors();
    } catch (error: unknown) {
      console.error('Error adding instructor:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add instructor',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Instructor Management</h1>
          <p className="text-muted-foreground">Manage instructors who review assignments and projects</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Instructor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Instructors</span>
          </div>
          <p className="text-2xl font-bold">{instructors.length}</p>
        </div>
      </div>

      {/* Instructors List */}
      <div className="bg-card rounded-xl border shadow-card overflow-hidden">
        {instructors.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">No instructors yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add instructors to review student submissions
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Instructor</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Assigned Students</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {instructors.map((instructor) => (
                  <tr key={instructor.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {instructor.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{instructor.fullName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {instructor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {instructor.studentsCount === 0 ? (
                        <span className="text-muted-foreground text-sm">No students assigned</span>
                      ) : (
                        <div className="min-w-[200px]">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {instructor.students.slice(0, VISIBLE_STUDENTS_INLINE).map((student) => (
                              <Badge key={student.id} variant="outline" className="text-xs">
                                {student.profile?.fullName || student.email}
                              </Badge>
                            ))}
                            {instructor.studentsCount > VISIBLE_STUDENTS_INLINE && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => setExpandedInstructorId((id) => (id === instructor.id ? null : instructor.id))}
                              >
                                {expandedInstructorId === instructor.id ? (
                                  <>Show less <ChevronUp className="w-3 h-3 ml-0.5 inline" /></>
                                ) : (
                                  <>+{instructor.studentsCount - VISIBLE_STUDENTS_INLINE} more <ChevronDown className="w-3 h-3 ml-0.5 inline" /></>
                                )}
                              </Button>
                            )}
                          </div>
                          {expandedInstructorId === instructor.id && instructor.students.length > VISIBLE_STUDENTS_INLINE && (
                            <div
                              className="mt-2 p-2 rounded-lg border border-border bg-muted/30 overflow-y-auto"
                              style={{ maxHeight: EXPANDED_LIST_MAX_HEIGHT }}
                            >
                              <p className="text-xs font-medium text-muted-foreground mb-2">All assigned students ({instructor.students.length})</p>
                              <ul className="space-y-1.5">
                                {instructor.students.map((student) => (
                                  <li key={student.id} className="text-sm text-foreground flex items-center gap-2">
                                    <span className="truncate">{student.profile?.fullName || student.email}</span>
                                    <span className="text-muted-foreground truncate text-xs">({student.email})</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-muted-foreground">
                        {new Date(instructor.createdAt).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Instructor Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Instructor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInstructor} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="instructor@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background"
                placeholder="Leave empty for default"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Default: Instructor123!
              </p>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Instructor'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstructors;
