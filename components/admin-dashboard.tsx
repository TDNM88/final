"use client"

import React, { useState, useEffect, useCallback, useMemo, ReactNode } from "react"
import { id, vi } from "date-fns/locale";
import {
  Home,
  Users,
  Clock,
  CreditCard,
  BarChart,
  Settings,
  LogOut,
  ChevronDown,
  ChevronUp,
  Plus,
  Search,
  Filter,
  Edit as EditIcon,
  Trash2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Timer,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Download,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  Eye,
  Check,
  X,
  XCircle,
  Upload,
  Bell,
  HelpCircle,
  Save,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMinutes, differenceInSeconds, isAfter, isBefore, parseISO } from "date-fns"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { UserMenu } from "@/components/user-menu"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { generateSessions as generateSessionsUtil } from "@/lib/sessionUtils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";

// Use the imported generateSessions function directly

type Order = {
  id: string
  customer: string
  customerId: string
  user: string
  amount: number
  status: 'pending' | 'active' | 'win' | 'lose' | 'completed'
  date: Date
  type: string
  result: number
  time: string | Date
  timeRemaining: number
  sessionProgress: number
  isWin: boolean
  session: string
}

interface TradingSession {
  id: string; // PhienID format YYYYMMDDHHMM
  startTime: Date;
  endTime: Date;
  status: 'upcoming' | 'active' | 'completed';
  result: string;
  session: string;
  progress: number;
}

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// Add useToast hook import
const useToast = () => ({
  toast: (options: { title: string; description: string; variant?: string }) => {
    console.log('Toast:', options);
  }
});

type BankAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch?: string;
};

type DepositRequest = {
  _id: string;
  userId: string;
  username: string;
  amount: number;
  status: RequestStatus;
  createdAt: Date;
  updatedAt: Date;
  transactionCode?: string;
  note?: string;
  processedBy?: string;
  processedAt?: Date;
};

type WithdrawalRequest = {
  time: ReactNode;
  customer: ReactNode;
  bank: ReactNode;
  accountNumber: ReactNode;
  accountHolder: ReactNode;
  _id: string;
  userId: string;
  username: string;
  amount: number;
  receivedAmount: number;
  status: RequestStatus;
  bankAccount: BankAccount;
  createdAt: Date;
  updatedAt: Date;
  note?: string;
  processedBy?: string;
  processedAt?: Date;
};

type PageType =
  | "dashboard"
  | "customers"
  | "order-history"
  | "trading-sessions"
  | "deposit-requests"
  | "withdrawal-requests"
  | "settings"

// Types for customer data
type Customer = {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  balance?: {
    available: number;
    frozen: number;
  };
  status: {
    active: boolean;
    betLocked: boolean;
    withdrawLocked: boolean;
  };
  createdAt?: Date;
  lastLogin?: Date;
};

// Add these interfaces at the top with other interfaces
interface RecentUser {
  _id: string;
  username: string;
  fullName?: string;
  email?: string;
  phone?: string;
  balance?: {
    available: number;
    frozen: number;
  };
  status: {
    active: boolean;
    betLocked: boolean;
    withdrawLocked: boolean;
  };
  createdAt: string;
  lastLogin?: string;
}

interface RecentSession {
  _id: string;
  sessionId: string;
  startTime: string;
  endTime: string;
  status: 'upcoming' | 'active' | 'completed';
  result?: string;
}


// Page Components
const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to safely parse dates from API response
  const parseCustomerDates = (customerData: any): Customer => {
    try {
      return {
        ...customerData,
        createdAt: customerData.createdAt 
          ? new Date(customerData.createdAt) 
          : undefined,
        lastLogin: customerData.lastLogin 
          ? new Date(customerData.lastLogin) 
          : undefined
      };
    } catch (error) {
      console.error('Error parsing customer dates:', error);
      return {
        ...customerData,
        createdAt: undefined,
        lastLogin: undefined
      };
    }
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/users');
        if (!response.ok) {
          throw new Error('Không thể tải dữ liệu khách hàng');
        }
        const data = await response.json();
        
        // Ensure data is an array and parse dates
        if (!Array.isArray(data)) {
          throw new Error('Dữ liệu trả về không hợp lệ');
        }
        
        // Parse dates and handle potential errors
        const customersWithDates = data.map(customer => {
          try {
            return {
              ...customer,
              createdAt: customer.createdAt ? new Date(customer.createdAt) : undefined,
              lastLogin: customer.lastLogin ? new Date(customer.lastLogin) : undefined
            };
          } catch (dateError) {
            console.error('Lỗi khi chuyển đổi ngày tháng:', dateError);
            return {
              ...customer,
              createdAt: undefined,
              lastLogin: undefined
            };
          }
        });
        
        setCustomers(customersWithDates);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khách hàng:', err);
        setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Debounce search term to avoid too many re-renders
  const debouncedSearchTerm = useMemo(() => {
    return searchTerm;
  }, [searchTerm]);

  // Filter customers based on search term with debounce
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearchTerm) return customers;
    
    const term = debouncedSearchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.username.toLowerCase().includes(term) ||
      (customer.fullName?.toLowerCase() || '').includes(term) ||
      (customer.email?.toLowerCase() || '').includes(term) ||
      (customer.phone?.toLowerCase() || '').includes(term)
    );
  }, [customers, debouncedSearchTerm]);

  // Get current customers for pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = useMemo(() => {
    return filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  }, [filteredCustomers, indexOfFirstCustomer, indexOfLastCustomer]);
  
  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / customersPerPage));
  
  // Reset to first page if current page is out of bounds after filtering
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const handleStatusToggle = async (userId: string, field: 'active' | 'betLocked' | 'withdrawLocked') => {
    try {
      // Create optimistic update
      setCustomers(prevCustomers => 
        prevCustomers.map(customer => 
          customer._id === userId
            ? {
                ...customer,
                status: {
                  ...customer.status,
                  [field]: !customer.status?.[field]
                }
              }
            : customer
        )
      );
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: {
            ...customers.find(c => c._id === userId)?.status,
            [field]: !customers.find(c => c._id === userId)?.status[field]
          }
        })
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      // The optimistic update already handled the UI update
      // Just verify the server response was successful

      const currentValue = !customers.find(c => c._id === userId)?.status[field];
      toast({
        title: 'Thành công',
        description: `Đã ${currentValue ? 'bật' : 'tắt'} ${getStatusFieldName(field)}`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể cập nhật trạng thái người dùng',
        variant: 'destructive',
      });
    }
  };

  const getStatusFieldName = (field: string) => {
    switch (field) {
      case 'active':
        return 'trạng thái hoạt động';
      case 'betLocked':
        return 'khóa đặt cược';
      case 'withdrawLocked':
        return 'khóa rút tiền';
      default:
        return 'trạng thái';
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      status: customer.status?.active ? 'active' : 'inactive'
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer) return;
    
    try {
      const response = await fetch(`/api/admin/users/${deletingCustomer._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Không thể xóa người dùng');
      }

      // Update the customers list by removing the deleted customer
      setCustomers(customers.filter(customer => customer._id !== deletingCustomer._id));
      
      toast({
        title: 'Thành công',
        description: 'Đã xóa người dùng thành công',
        variant: 'default',
      });
    } catch (err) {
      console.error('Lỗi khi xóa người dùng:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa người dùng. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeletingCustomer(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      status: value
    }));
  };

  const handleSaveChanges = async () => {
    if (!editingCustomer) return;
    
    try {
      setIsSaving(true);
      
      // Validate form data
      if (!formData.fullName.trim()) {
        throw new Error('Vui lòng nhập họ tên');
      }
      
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        throw new Error('Email không hợp lệ');
      }
      
      const response = await fetch(`/api/admin/users/${editingCustomer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          status: {
            active: formData.status === 'active',
            betLocked: editingCustomer.status?.betLocked || false,
            withdrawLocked: editingCustomer.status?.withdrawLocked || false
          }
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Cập nhật thông tin thất bại');
      }

      // Update local state
      setCustomers(customers.map(customer => 
        customer._id === editingCustomer._id
          ? {
              ...customer,
              fullName: formData.fullName.trim(),
              email: formData.email.trim() || undefined,
              phone: formData.phone.trim() || undefined,
              status: {
                ...customer.status,
                active: formData.status === 'active'
              }
            }
          : customer
      ));

      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin khách hàng thành công',
        variant: 'default',
      });

      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Lỗi khi cập nhật thông tin:', err);
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể cập nhật thông tin khách hàng',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Lỗi! </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Quản lý khách hàng</h2>
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Tìm kiếm khách hàng..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số điện thoại</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.length > 0 ? (
                  currentCustomers.map((customer) => (
                    <TableRow key={customer._id}>
                      <TableCell className="font-medium">{customer.username}</TableCell>
                      <TableCell>{customer.fullName || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell>{customer.phone || '-'}</TableCell>
                      <TableCell>
                        {customer.balance?.available !== undefined 
                          ? `${customer.balance.available.toLocaleString('vi-VN')} VNĐ` 
                          : '0 VNĐ'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                key={`active-${customer._id}`}
                                checked={customer.status?.active ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'active')}
                                className="ml-2"
                              />
                              <Label htmlFor={`active-${customer._id}`} className="cursor-pointer">
                                {customer.status?.active ? 'Đang hoạt động' : 'Đã khóa'}
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                key={`bet-lock-${customer._id}`}
                                checked={customer.status?.betLocked ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'betLocked')}
                                className="ml-2"
                              />
                              <Label htmlFor={`bet-lock-${customer._id}`} className="cursor-pointer">
                                {customer.status?.betLocked ? 'Khóa cược' : 'Mở cược'}
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                key={`withdraw-lock-${customer._id}`}
                                checked={customer.status?.withdrawLocked ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'withdrawLocked')}
                                className="ml-2"
                              />
                              <Label htmlFor={`withdraw-lock-${customer._id}`} className="cursor-pointer">
                                {customer.status?.withdrawLocked ? 'Khóa rút tiền' : 'Mở rút tiền'}
                              </Label>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.createdAt && !isNaN(new Date(customer.createdAt).getTime())
                          ? format(new Date(customer.createdAt), 'dd/MM/yyyy HH:mm')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-blue-100"
                            onClick={() => handleEditClick(customer)}
                          >
                            <EditIcon className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:bg-red-100"
                            onClick={() => handleDeleteClick(customer)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Không tìm thấy khách hàng nào phù hợp
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <div className="text-sm text-gray-600">
                Hiển thị {indexOfFirstCustomer + 1}-{Math.min(indexOfLastCustomer, filteredCustomers.length)} trong tổng số {filteredCustomers.length} khách hàng
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Trước
                </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Customer Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin khách hàng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin khách hàng. Nhấn Lưu khi hoàn tất.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Nhập họ tên"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại"
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.status}
                onValueChange={handleSelectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSaving}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa người dùng {deletingCustomer?.username}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface OrderHistoryFilter {
  username: string;
  startDate: string;
  endDate: string;
  status: string;
}

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<OrderHistoryFilter>({
    username: '',
    startDate: '',
    endDate: '',
    status: 'all'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchOrders = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true);
      const { username, startDate, endDate, status } = filters;
      
      let url = `/api/admin/orders?page=${page}&limit=${itemsPerPage}`;
      if (username) url += `&username=${encodeURIComponent(username)}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (status !== 'all') url += `&status=${status}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (response.ok) {
        setOrders(data.orders || []);
        setTotalItems(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCurrentPage(page);
      } else {
        throw new Error(data.error || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải lịch sử đơn hàng. Vui lòng thử lại.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders(1);
  }, [filters, fetchOrders]);

  const handleFilterChange = (field: keyof OrderHistoryFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      username: '',
      startDate: '',
      endDate: '',
      status: 'all'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const renderStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: string }> = {
      pending: { label: 'Đang chờ', variant: 'bg-yellow-100 text-yellow-800' },
      active: { label: 'Đang diễn ra', variant: 'bg-blue-100 text-blue-800' },
      win: { label: 'Thắng', variant: 'bg-green-100 text-green-800' },
      lose: { label: 'Thua', variant: 'bg-red-100 text-red-800' },
      completed: { label: 'Hoàn thành', variant: 'bg-gray-100 text-gray-800' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.variant}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Lịch sử đơn hàng</span>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập</Label>
              <Input
                id="username"
                placeholder="Nhập tên đăng nhập"
                value={filters.username}
                onChange={(e) => handleFilterChange('username', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Từ ngày</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Đến ngày</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="active">Đang diễn ra</SelectItem>
                  <SelectItem value="win">Thắng</SelectItem>
                  <SelectItem value="lose">Thua</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <Button
              variant="outline"
              onClick={handleResetFilters}
              disabled={isLoading}
            >
              Đặt lại
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử đơn hàng</CardTitle>
          <CardDescription>
            Tổng cộng: {totalItems} đơn hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Không tìm thấy đơn hàng nào phù hợp
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phiên</TableHead>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Loại cược</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{order.session}</TableCell>
                      <TableCell>{order.user}</TableCell>
                      <TableCell>
                        <Badge
                          variant={order.type === 'Lên' ? 'default' : 'destructive'}
                          className={cn(
                            order.type === 'Lên' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-red-500 hover:bg-red-600',
                            'text-white'
                          )}
                        >
                          {order.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(order.amount)}
                      </TableCell>
                      <TableCell className={cn("font-semibold", {
                        'text-green-600': order.status === 'win',
                        'text-red-600': order.status === 'lose',
                        'text-gray-600': !['win', 'lose'].includes(order.status)
                      })}>
                        {order.status === 'win' 
                          ? `+${formatCurrency(order.result || 0)}` 
                          : order.status === 'lose' 
                            ? `-${formatCurrency(order.amount)}` 
                            : '-'}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(order.time as string)}
                      </TableCell>
                      <TableCell>
                        {renderStatusBadge(order.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} của {totalItems} kết quả
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(currentPage - 1)}
                      disabled={currentPage === 1 || isLoading}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                    >
                      Tiếp
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

const DepositRequestsPage = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  const { toast } = useToast();

  const fetchDeposits = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/deposits?${queryParams}`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách yêu cầu nạp tiền');
      }
      
      const data = await response.json();
      setDeposits(data.deposits.map((d: any) => ({
        ...d,
        createdAt: new Date(d.createdAt),
        updatedAt: new Date(d.updatedAt),
        ...(d.processedAt && { processedAt: new Date(d.processedAt) })
      })));
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('Lỗi khi tải yêu cầu nạp tiền:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu nạp tiền',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/deposits/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      await fetchDeposits(currentPage);
      
      toast({
        title: 'Thành công',
        description: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu nạp tiền`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: RequestStatus) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yêu cầu nạp tiền</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mã giao dịch..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : deposits.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Không tìm thấy yêu cầu nạp tiền nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Mã giao dịch</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow key={deposit._id}>
                    <TableCell className="whitespace-nowrap">
                      {format(deposit.createdAt, 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{deposit.username}</div>
                      <div className="text-xs text-gray-500">ID: {deposit.userId}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deposit.amount)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {deposit.transactionCode || 'Chưa có'}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(deposit.status)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {deposit.note || '-'}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {deposit.status === 'pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleStatusUpdate(deposit._id, 'approved')}
                          >
                            Duyệt
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => {
                              const note = prompt('Lý do từ chối (nếu có):');
                              if (note !== null) {
                                handleStatusUpdate(deposit._id, 'rejected', note);
                              }
                            }}
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeposits(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDeposits(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Update the DashboardPage component
const DashboardPage = () => {
  // Existing state
  const [customerFilter, setCustomerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState("01/06/2025");
  const [endDate, setEndDate] = useState("29/06/2025");
  const [isLoading, setIsLoading] = useState(false);
  
  // New state for recent data
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [isLoadingRecentData, setIsLoadingRecentData] = useState(true);

  // Fetch recent data
  useEffect(() => {
    const fetchRecentData = async () => {
      try {
        setIsLoadingRecentData(true);
        
        // Fetch recent users
        const [usersRes, sessionsRes] = await Promise.all([
          fetch('/api/admin/recent-users'),
          fetch('/api/admin/recent-sessions')
        ]);
        
        const [usersData, sessionsData] = await Promise.all([
          usersRes.json(),
          sessionsRes.json()
        ]);
        
        // Process sessions data to match TradingSession type
        const processedSessions = (sessionsData.sessions || []).map((session: any) => ({
          ...session,
          startTime: new Date(session.startTime),
          endTime: new Date(session.endTime),
          status: getSessionStatus(session.startTime, session.endTime),
          progress: calculateSessionProgress(session.startTime, session.endTime)
        }));
        
        // Sort sessions by start time (newest first)
        const sortedSessions = processedSessions.sort((a: any, b: any) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        
        // Get top 10 upcoming or active sessions
        const upcomingOrActiveSessions = sortedSessions
          .filter((s: any) => s.status !== 'completed')
          .slice(0, 10);
        
        setRecentUsers(usersData.users || []);
        setRecentSessions(upcomingOrActiveSessions);
      } catch (error) {
        console.error('Error fetching recent data:', error);
        toast({
          variant: "destructive",
          title: "Lỗi",
          description: "Không thể tải dữ liệu mới nhất. Vui lòng thử lại.",
        });
      } finally {
        setIsLoadingRecentData(false);
      }
    };

    // Initial fetch
    fetchRecentData();
    
    // Set up interval to update session status and progress
    const intervalId = setInterval(() => {
      setRecentSessions(prevSessions => 
        prevSessions.map(session => ({
          ...session,
          status: getSessionStatus(session.startTime, session.endTime),
          progress: calculateSessionProgress(session.startTime, session.endTime)
        }))
      );
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Helper function to get session status
  const getSessionStatus = (startTime: string | Date, endTime: string | Date) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'completed';
  };
  
  // Helper function to calculate session progress
  const calculateSessionProgress = (startTime: string | Date, endTime: string | Date) => {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.min(100, (elapsed / total) * 100);
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value) + 'đ';
  };

  // Format date with proper error handling
  const formatDate = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';  // Handle undefined, null, or empty string
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return '-';
      }
      
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };
  
  // Format time in HH:MM:SS
  const formatTime = (dateString: string | Date | undefined | null): string => {
    if (!dateString) return '-';
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) return '-';
      return format(date, 'HH:mm:ss', { locale: vi });
    } catch (error) {
      return '-';
    }
  };

  const handleApplyFilter = async () => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Đã áp dụng bộ lọc",
        description: `Hiển thị dữ liệu từ ${startDate} đến ${endDate}`,
      })
    }, 1000)
  }

  const handleResetFilter = () => {
    setStartDate("01/06/2025")
    setEndDate("29/06/2025")
    toast({
      title: "Đã đặt lại bộ lọc",
      description: "Trở về thiết lập mặc định",
    })
  }
  
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Bảng điều khiển</span>
      </div>

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>10 Phiên giao dịch gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecentData ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Phiên</TableHead>
                  <TableHead>Thời gian bắt đầu</TableHead>
                  <TableHead>Thời gian kết thúc</TableHead>
                  <TableHead>Kết quả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentSessions.map((session) => (
                  <TableRow key={session._id}>
                    <TableCell>{session.sessionId}</TableCell>
                    <TableCell>{formatDate(session.startTime)}</TableCell>
                    <TableCell>{formatDate(session.endTime)}</TableCell>
                    <TableCell className={session.result === 'LÊN' ? 'text-green-500' : 'text-red-500'}>
                      {session.result || 'Đang chờ...'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          session.status === 'completed'
                            ? 'default'
                            : session.status === 'active'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {session.status === 'completed'
                          ? 'Đã hoàn thành'
                          : session.status === 'active'
                          ? 'Đang diễn ra'
                          : 'Sắp diễn ra'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>10 Người dùng mới nhất</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecentData ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên đăng nhập</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Số dư</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.fullName || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      {user.balance ? formatCurrency(user.balance.available) : '0đ'}
                    </TableCell>
                    <TableCell>
                      {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: vi }) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status?.active
                            ? 'default'
                            : 'destructive'
                        }
                      >
                        {user.status?.active ? 'Hoạt động' : 'Đã khóa'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

  const TradingSessionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 10
  const [allSessions, setAllSessions] = useState<TradingSession[]>(() => {
    // Generate 30 sessions starting from the next minute
    const startTime = new Date();
    startTime.setMinutes(startTime.getMinutes() + 1);
    startTime.setSeconds(1, 0);
    
    // Map the Session[] to TradingSession[]
    return generateSessionsUtil(startTime, 30).map(session => ({
      id: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      status: 'upcoming',
      result: Math.random() > 0.5 ? 'LÊN' : 'XUỐNG',
      session: session.label,
      progress: 0
    }));
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeSessionIndex, setActiveSessionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  const totalPages = Math.ceil(allSessions.length / sessionsPerPage)
  const currentSessions = allSessions.slice((currentPage - 1) * sessionsPerPage, currentPage * sessionsPerPage)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Update session statuses based on current time
  useEffect(() => {
    try {
      setIsLoading(true)
      setAllSessions(prevSessions => {
        return prevSessions.map((session, index) => {
          const startTime = new Date(session.startTime)
          const endTime = new Date(session.endTime)
          const now = currentTime
          
          let status: 'upcoming' | 'active' | 'completed' = 'upcoming'
          let progress = 0
          
          if (now < startTime) {
            status = 'upcoming'
          } else if (now >= startTime && now <= endTime) {
            status = 'active'
            const totalDuration = endTime.getTime() - startTime.getTime()
            const elapsed = now.getTime() - startTime.getTime()
            progress = Math.min(100, (elapsed / totalDuration) * 100)
            if (index !== activeSessionIndex) {
              setActiveSessionIndex(index)
            }
          } else {
            status = 'completed'
            progress = 100
          }
          
          return { ...session, status, progress }
        })
      })
    } catch (error) {
      console.error('Error updating session statuses:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentTime, activeSessionIndex])
  
  // Get current active or upcoming session
  const currentSession = allSessions[activeSessionIndex] || allSessions[0]
  const nextSession = allSessions[activeSessionIndex + 1]
  
  // Calculate time remaining in current session
  const getTimeRemaining = useCallback(() => {
    if (!currentSession) return { minutes: 0, seconds: 0 }
    
    const endTime = new Date(currentSession.endTime)
    const now = currentTime
    
    if (now > endTime) return { minutes: 0, seconds: 0 }
    
    const diffInSeconds = Math.floor((endTime.getTime() - now.getTime()) / 1000)
    return {
      minutes: Math.floor(diffInSeconds / 60),
      seconds: diffInSeconds % 60
    }
  }, [currentSession, currentTime])
  
  const { minutes, seconds } = getTimeRemaining()
  const isSessionActive = currentSession?.status === 'active'

  return (
    <div className="space-y-6 p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Phiên giao dịch</span>
      </div>

      {/* Current Session Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Session Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Phiên hiện tại</CardTitle>
              <div className={cn("px-2 py-1 text-xs rounded-full", {
                'bg-green-100 text-green-800': isSessionActive,
                'bg-yellow-100 text-yellow-800': !isSessionActive
              })}>
                {isSessionActive ? 'Đang diễn ra' : 'Sắp bắt đầu'}
              </div>
            </div>
            <CardDescription className="text-sm">
              {format(currentSession?.startTime, 'dd/MM/yyyy HH:mm:ss')} - {format(currentSession?.endTime, 'dd/MM/yyyy HH:mm:ss')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-4xl font-bold text-center py-4">
              <div className="flex justify-center items-end gap-1">
                <span className="text-6xl">{minutes.toString().padStart(2, '0')}</span>
                <span className="text-2xl mb-1">:</span>
                <span className="text-6xl">{seconds.toString().padStart(2, '0')}</span>
                <span className="text-2xl mb-1">s</span>
              </div>
              <div className="text-sm text-muted-foreground mt-2">Thời gian còn lại</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Mã phiên:</span>
                <span className="font-medium">{currentSession?.session}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dự đoán:</span>
                <span className={cn("font-semibold", {
                  'text-green-600': currentSession?.result === 'LÊN',
                  'text-red-600': currentSession?.result === 'XUỐNG'
                })}>
                  {currentSession?.result}
                </span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tiến trình</span>
                <span>{Math.round(currentSession?.progress || 0)}%</span>
              </div>
              <Progress value={currentSession?.progress} className="h-2" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between text-sm">
            <div className="text-muted-foreground">Phiên tiếp theo:</div>
            <div className="font-medium">{nextSession?.session || '--'}</div>
          </CardFooter>
        </Card>
        
        {/* Session Info Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Thông tin phiên giao dịch</CardTitle>
            <CardDescription>Danh sách các phiên giao dịch gần đây</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã phiên</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Kết quả</TableHead>
                    <TableHead>Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSessions.slice(0, 5).map((session) => (
                    <TableRow key={session.session}>
                      <TableCell className="font-medium">{session.session}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(session.startTime, 'HH:mm:ss')}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(session.startTime, 'dd/MM/yyyy')}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={session.result === 'LÊN' ? 'default' : 'destructive'}
                          className={cn({
                            'bg-green-100 text-green-800 hover:bg-green-100': session.result === 'LÊN',
                            'bg-red-100 text-red-800 hover:bg-red-100': session.result === 'XUỐNG',
                            'bg-green-500 hover:bg-green-600': session.result === 'Lên',
                            'bg-red-500 hover:bg-red-600': session.result === 'Xuống'
                          })}
                        >
                          {session.result}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {session.status === 'active' && (
                          <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                              Đang diễn ra
                            </div>
                          </Badge>
                        )}
                        {session.status === 'upcoming' && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Sắp diễn ra
                          </Badge>
                        )}
                        {session.status === 'completed' && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Hoàn thành
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Session History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Lịch sử phiên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Phiên</TableHead>
                <TableHead>Kết quả</TableHead>
                <TableHead>Thời gian bắt đầu</TableHead>
                <TableHead>Thời gian kết thúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSessions.map((session, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{session.session}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={session.result === 'LÊN' ? 'default' : 'destructive'}
                      className={cn({
                        'bg-green-100 text-green-800 hover:bg-green-100': session.result === 'LÊN',
                        'bg-red-100 text-red-800 hover:bg-red-100': session.result === 'XUỐNG',
                      })}
                    >
                      {session.result}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(session.startTime, 'HH:mm:ss')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(session.startTime, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(session.endTime, 'HH:mm:ss')}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(session.endTime, 'dd/MM/yyyy')}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">{sessionsPerPage} / page</div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant="outline"
              size="sm"
              className={currentPage === page ? "bg-blue-600 text-white" : ""}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function WithdrawalRequestsPage() {

  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('pending');
  const [customerFilter, setCustomerFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;
  const { toast } = useToast();

  const fetchWithdrawals = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await fetch(`/api/admin/withdrawals?${queryParams}`);
      if (!response.ok) {
        throw new Error('Không thể tải danh sách yêu cầu rút tiền');
      }
      
      const data = await response.json();
      setWithdrawals(data.withdrawals.map((w: any) => ({
        ...w,
        createdAt: new Date(w.createdAt),
        updatedAt: new Date(w.updatedAt),
        ...(w.processedAt && { processedAt: new Date(w.processedAt) })
      })));
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err) {
      console.error('Lỗi khi tải yêu cầu rút tiền:', err);
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách yêu cầu rút tiền',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected', note?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/withdrawals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      await fetchWithdrawals(currentPage);
      
      toast({
        title: 'Thành công',
        description: `Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} yêu cầu rút tiền`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái yêu cầu',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: RequestStatus) => {
    const statusMap = {
      pending: { label: 'Chờ xử lý', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Đã duyệt', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', color: 'bg-red-100 text-red-800' },
      cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-800' }
    };
    
    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatBankInfo = (bankAccount: BankAccount | undefined) => {
    if (!bankAccount) return 'N/A';
    return `${bankAccount.bankName} - ${bankAccount.accountNumber} (${bankAccount.accountHolder})`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Yêu cầu rút tiền</h2>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số tài khoản..."
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select 
            value={statusFilter} 
            onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Lọc theo trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ xử lý</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
              <SelectItem value="rejected">Từ chối</SelectItem>
              <SelectItem value="cancelled">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
              <span className="ml-2">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">{error}</div>
          ) : withdrawals.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Không tìm thấy yêu cầu rút tiền nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Số tiền</TableHead>
                  <TableHead>Nhận về</TableHead>
                  <TableHead>Ngân hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal._id}>
                    <TableCell className="whitespace-nowrap">
                      {format(withdrawal.createdAt, 'dd/MM/yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>{withdrawal.username}</div>
                      <div className="text-xs text-gray-500">ID: {withdrawal.userId}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(withdrawal.amount)}
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(withdrawal.receivedAmount)}
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{withdrawal.bankAccount.bankName}</div>
                      <div className="text-xs text-gray-500">{withdrawal.bankAccount.accountNumber}</div>
                      <div className="text-xs text-gray-500">{withdrawal.bankAccount.accountHolder}</div>
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(withdrawal.status)}
                      {withdrawal.processedAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          {format(withdrawal.processedAt, 'dd/MM/yyyy HH:mm')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {withdrawal.status === 'pending' && (
                        <div className="flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(withdrawal._id, 'approved')}
                                className="text-green-600"
                              >
                                <Check className="mr-2 h-4 w-4" /> Duyệt
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleStatusUpdate(withdrawal._id, 'rejected')}
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" /> Từ chối
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Trang {currentPage} / {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWithdrawals(currentPage - 1)}
              disabled={currentPage <= 1 || loading}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWithdrawals(currentPage + 1)}
              disabled={currentPage >= totalPages || loading}
            >
              Tiếp
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
// Settings Page Component
function SettingsPage() {
  const [bankName, setBankName] = useState<string>("ABBANK")
  const [accountNumber, setAccountNumber] = useState<string>("0387473721")
  const [accountHolder, setAccountHolder] = useState<string>("VU VAN MIEN")
  const [minDeposit, setMinDeposit] = useState<string>("100,000")
  const [minWithdrawal, setMinWithdrawal] = useState<string>("100,000")
  const [maxWithdrawal, setMaxWithdrawal] = useState<string>("100,000")
  const [cskh, setCskh] = useState<string>("https://t.me/DICHVUCSKHLS")

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Cài đặt</span>
      </div>

      <div className="max-w-2xl">
        {/* Bank Information Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thông tin ngân hàng nạp tiền</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bankName">Tên ngân hàng</Label>
                <Input
                  id="bankName"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accountNumber">Số tài khoản</Label>
                <Input
                  id="accountNumber"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="accountHolder">Chủ tài khoản</Label>
              <Input
                id="accountHolder"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Deposit/Withdrawal Limits Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cấu hình nạp rút</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minDeposit">Số tiền nạp tối thiểu</Label>
                <Input
                  id="minDeposit"
                  value={minDeposit}
                  onChange={(e) => setMinDeposit(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="minWithdrawal">Số tiền rút tối thiểu</Label>
                <Input
                  id="minWithdrawal"
                  value={minWithdrawal}
                  onChange={(e) => setMinWithdrawal(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="maxWithdrawal">Số tiền đặt lệnh tối thiểu</Label>
                <Input
                  id="maxWithdrawal"
                  value={maxWithdrawal}
                  onChange={(e) => setMaxWithdrawal(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CSKH Link Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div>
              <Label htmlFor="cskhLink">Link CSKH</Label>
              <Input
                id="cskhLink"
                value={cskh}
                onChange={(e) => setCskh(e.target.value)}
                className="mb-4"
              />
              <Button className="bg-green-600 hover:bg-green-700">Lưu</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const menuItems = [
  {
    id: 'dashboard' as PageType,
    title: 'Dashboard',
    icon: Home,
  },
  {
    id: 'customers' as PageType,
    title: 'Khách hàng',
    icon: Users,
  },
  {
    id: 'order-history' as PageType,
    title: 'Lịch sử đơn hàng',
    icon: Clock,
  },
  {
    id: 'trading-sessions' as PageType,
    title: 'Phiên giao dịch',
    icon: Timer,
  },
  {
    id: 'deposit-requests' as PageType,
    title: 'Yêu cầu nạp tiền',
    icon: CreditCard,
  },
  {
    id: 'withdrawal-requests' as PageType,
    title: 'Yêu cầu rút tiền',
    icon: ArrowUpDown,
  },
  {
    id: 'settings' as PageType,
    title: 'Cài đặt',
    icon: Settings,
  },
]

function AppSidebar({
  currentPage,
  setCurrentPage,
}: { currentPage: PageType; setCurrentPage: (page: PageType) => void }) {
  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item: { id: PageType; title: string; icon: any }) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPage === item.id}
                    className={currentPage === item.id ? "bg-green-100 text-green-700 hover:bg-green-100" : ""}
                  >
                    <button
                      onClick={() => setCurrentPage(item.id)}
                      className="flex items-center gap-3 w-full text-left"
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

export function AdminDashboard() {
  const [currentPage, setCurrentPage] = useState<PageType>("dashboard")

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />
      case "customers":
        return <CustomersPage />
      case "order-history":
        return <OrderHistoryPage />
      case "trading-sessions":
        return <TradingSessionsPage />
      case "deposit-requests":
        return <DepositRequestsPage />
      case "withdrawal-requests":
        return <WithdrawalRequestsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gray-50">
        <AppSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <div className="flex-1">
          {/* Header */}
          <header className="bg-slate-700 text-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                <SidebarTrigger className="text-white hover:bg-slate-600" />
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-600">
                  <Bell className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-600">
                  <HelpCircle className="h-5 w-5" />
                </Button>
                <UserMenu />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">{renderCurrentPage()}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function parseTimestamp(timestamp: string): Date {
  // Format: YYYYMMDDHHmm (e.g., 202706041201 for June 4, 2027, 12:01)
  const year = parseInt(timestamp.slice(0, 4));
  const month = parseInt(timestamp.slice(4, 6)) - 1; // Months are 0-indexed
  const day = parseInt(timestamp.slice(6, 8));
  const hours = parseInt(timestamp.slice(8, 10));
  const minutes = parseInt(timestamp.slice(10, 12));
  
  return new Date(year, month, day, hours, minutes);
}


