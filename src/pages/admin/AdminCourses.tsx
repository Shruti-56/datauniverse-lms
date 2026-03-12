import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Users, 
  Search,
  Video,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';

type Course = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  thumbnailUrl: string | null;
  isVisible: boolean;
  videoCount: number;
  studentCount: number;
};

type CourseFormData = {
  title: string;
  description: string;
  category: string;
  level: string;
  price: number;
  durationHours: number;
};

const AdminCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    description: '',
    category: 'DATA_ANALYTICS',
    level: 'BEGINNER',
    price: 99.99,
    durationHours: 10,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/courses');
      if (response.ok) {
        const data = await response.json();
        setCourses(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load courses' }));
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to load courses',
          variant: 'destructive',
        });
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses. Please check if backend is running.',
        variant: 'destructive',
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCourseVisibility = async (courseId: string, currentVisibility: boolean) => {
    try {
      const response = await api.patch(`/admin/courses/${courseId}/visibility`, {
        isVisible: !currentVisibility,
      });

      if (response.ok) {
        setCourses(prev =>
          prev.map(c =>
            c.id === courseId ? { ...c, isVisible: !currentVisibility } : c
          )
        );
        toast({
          title: 'Visibility Updated',
          description: `Course is now ${!currentVisibility ? 'visible' : 'hidden'}.`,
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update visibility',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || '',
        category: course.category,
        level: course.level,
        price: course.price,
        durationHours: course.durationHours,
      });
    } else {
      setEditingCourse(null);
      setFormData({
        title: '',
        description: '',
        category: 'DATA_ANALYTICS',
        level: 'BEGINNER',
        price: 99.99,
        durationHours: 10,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let response;
      if (editingCourse) {
        response = await api.put(`/admin/courses/${editingCourse.id}`, formData);
      } else {
        response = await api.post('/admin/courses', formData);
      }

      if (response.ok) {
        toast({
          title: editingCourse ? 'Course Updated' : 'Course Created',
          description: editingCourse
            ? 'The course has been updated successfully.'
            : 'A new course has been created.',
        });
        setIsDialogOpen(false);
        setEditingCourse(null);
        fetchCourses();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: 'Error',
        description: 'Failed to save course',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/admin/courses/${courseId}`);
      if (response.ok) {
        toast({
          title: 'Course Deleted',
          description: 'The course has been deleted successfully.',
        });
        fetchCourses();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete course',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive',
      });
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-success/10 text-success';
      case 'INTERMEDIATE': return 'bg-warning/10 text-warning';
      case 'ADVANCED': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCategory = (category: string) => {
    return category.replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">Course Management</h1>
          <p className="text-muted-foreground">Manage your platform's courses</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? 'Edit Course' : 'Add New Course'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveCourse} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Course Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    placeholder="Enter course title"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value="DATA_ANALYTICS">Data Analytics</option>
                    <option value="DATA_ENGINEERING">Data Engineering</option>
                    <option value="DATA_SCIENCE">Data Science</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Level</label>
                  <select 
                    value={formData.level}
                    onChange={(e) => setFormData(f => ({ ...f, level: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Price (₹)</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="99.99"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Duration (hours)</label>
                  <input
                    type="number"
                    value={formData.durationHours}
                    onChange={(e) => setFormData(f => ({ ...f, durationHours: parseInt(e.target.value) || 0 }))}
                    placeholder="10"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Enter course description"
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground resize-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Courses Table - relative z-0 so it doesn't overlap sidebar when scrolling */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden relative z-0">
        {filteredCourses.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            {searchQuery ? 'No courses found matching your search' : 'No courses yet. Create your first course!'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Course</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Level</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Students</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Visible</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCourses.map((course) => (
                  <tr key={course.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg gradient-hero flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary-foreground">
                            {course.category.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate max-w-[200px]">
                            {course.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {course.videoCount} videos
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">{formatCategory(course.category)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getLevelColor(course.level)}>{course.level}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">₹{course.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{course.studentCount.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Switch 
                        checked={course.isVisible}
                        onCheckedChange={() => toggleCourseVisibility(course.id, course.isVisible)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Videos
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDialog(course)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCourses;
