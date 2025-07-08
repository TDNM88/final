"use client"

import { useState, useEffect, useCallback, useMemo, ReactNode } from "react"
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
  Edit,
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
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, addMinutes, differenceInSeconds, isAfter, isBefore } from "date-fns"
import { Progress } from "@/components/ui/progress"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"

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



// Page Components
const CustomersPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const customersPerPage = 10;

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

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get current customers for pagination
  const indexOfLastCustomer = currentPage * customersPerPage;
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage;
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer);
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);

  const handleStatusToggle = async (userId: string, field: 'active' | 'betLocked' | 'withdrawLocked') => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          field,
          value: !customers.find(c => c._id === userId)?.status[field]
        })
      });

      if (!response.ok) {
        throw new Error('Cập nhật trạng thái thất bại');
      }

      // Update local state with proper date handling
      setCustomers(customers.map(customer => 
        customer._id === userId 
          ? parseCustomerDates({
              ...customer, 
              status: { 
                ...customer.status, 
                [field]: !customer.status[field] 
              } 
            })
          : customer
      ));
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật trạng thái người dùng',
        variant: 'destructive',
      });
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
                                id={`active-${customer._id}`}
                                checked={customer.status?.active ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'active')}
                              />
                              <Label htmlFor={`active-${customer._id}`} className="cursor-pointer">
                                {customer.status?.active ? 'Đang hoạt động' : 'Đã khóa'}
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`bet-lock-${customer._id}`}
                                checked={customer.status?.betLocked ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'betLocked')}
                              />
                              <Label htmlFor={`bet-lock-${customer._id}`} className="cursor-pointer">
                                {customer.status?.betLocked ? 'Khóa cược' : 'Mở cược'}
                              </Label>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={`withdraw-lock-${customer._id}`}
                                checked={customer.status?.withdrawLocked ?? false}
                                onCheckedChange={() => handleStatusToggle(customer._id, 'withdrawLocked')}
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
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
    </div>
  );
}

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Lịch sử đơn hàng</h2>
      <div className="space-y-4">
        {orders.length === 0 ? (
          <p className="text-gray-500">Không có dữ liệu đơn hàng</p>
        ) : (
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="border rounded p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{order.customer}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(order.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="mt-2">
                  <Badge variant="outline" className="mr-2">
                    {order.status}
                  </Badge>
                  <span>{order.amount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const DepositRequestsPage = () => {
  const [deposits, setDeposits] = useState<Array<{
    id: string
    customer: string
    amount: number
    status: 'pending' | 'approved' | 'rejected'
    date: Date
  }>>([])
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Yêu cầu nạp tiền</h2>
      <div className="space-y-4">
        {deposits.length === 0 ? (
          <p className="text-gray-500">Không có yêu cầu nạp tiền nào đang chờ xử lý</p>
        ) : (
          <div className="space-y-2">
            {deposits.map(deposit => (
              <div key={deposit.id} className="border rounded p-4 flex justify-between items-center">
                <div>
                  <div className="font-medium">{deposit.customer}</div>
                  <div className="text-sm text-gray-500">
                    {deposit.amount.toLocaleString('vi-VN')} VNĐ • {deposit.date.toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <div className="space-x-2">
                  <Button variant="outline" size="sm">Xem chi tiết</Button>
                  <Button size="sm">Duyệt</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const DashboardPage = () => {
  // State for filters
  const [customerFilter, setCustomerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // Mock data - replace with actual data fetching
  const [orderHistoryData, setOrderHistoryData] = useState<Order[]>([])
  
  // Stats data
  const [startDate, setStartDate] = useState("01/06/2025")
  const [endDate, setEndDate] = useState("29/06/2025")
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState({
    newAccounts: 131,
    totalDeposits: 10498420000,
    totalWithdrawals: 6980829240,
    totalAccounts: 5600000,
  })

  const [orderData, setOrderData] = useState([
    {
      user: "vuthanhtra",
      session: "29185379",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:59:22",
    },
    {
      user: "vuthanhtra",
      session: "29185378",
      type: "Lên",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:58:20",
    },
    {
      user: "vuthanhtra",
      session: "29185377",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:57:33",
    },
    {
      user: "vuthanhtra",
      session: "29185376",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:56:13",
    },
    {
      user: "vuthanhtra",
      session: "29185375",
      type: "Lên",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:55:18",
    },
    {
      user: "vuthanhtra",
      session: "29185374",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:54:30",
    },
    {
      user: "vuthanhtra",
      session: "29185374",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:54:18",
    },
    {
      user: "vuthanhtra",
      session: "29185373",
      type: "Xuống",
      amount: "1000000đ",
      result: "+190,000",
      time: "28/06/2025 21:53:36",
    },
  ])

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
        <span>Lịch sử giao dịch</span>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Khách hàng</Label>
              <Input
                id="customer"
                placeholder="Tìm theo tên hoặc mã"
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="win">Thắng</SelectItem>
                  <SelectItem value="lose">Thua</SelectItem>
                  <SelectItem value="pending">Đang chờ</SelectItem>
                  <SelectItem value="active">Đang diễn ra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Từ ngày</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Đến ngày</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order History Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Phiên</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead className="w-[100px]">Loại</TableHead>
                <TableHead className="w-[150px]">Số tiền</TableHead>
                <TableHead className="w-[150px]">Kết quả</TableHead>
                <TableHead>Thời gian đặt lệnh</TableHead>
                <TableHead className="w-[150px]">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistoryData.map((order: Order) => (
                <TableRow key={order.id} className={cn({
                  'bg-green-50': order.isWin,
                  'hover:bg-green-100': order.isWin,
                  'bg-red-50': !order.isWin && order.status === 'completed',
                  'hover:bg-red-100': !order.isWin && order.status === 'completed',
                  'bg-blue-50': order.status === 'active',
                  'hover:bg-blue-100': order.status === 'active',
                })}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{order.session}</span>
                      {order.status === 'active' && (
                        <div className="text-xs text-blue-600 flex items-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                          Đang diễn ra
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-teal-600 font-medium">{order.user}</TableCell>
                  <TableCell>
                    <Badge
                      variant={order.type === "Lên" ? "default" : "destructive"}
                      className={cn(
                        order.type === "Lên" 
                          ? "bg-green-500 hover:bg-green-600" 
                          : "bg-red-500 hover:bg-red-600",
                        "text-white"
                      )}
                    >
                      {order.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{order.amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}</TableCell>
                  <TableCell className={cn("font-semibold", {
                    'text-green-600': order.result > 0,
                    'text-red-600': order.result < 0,
                    'text-gray-600': order.result === 0
                  })}>
                    {(order.result || 0).toLocaleString('vi-VN', { style: 'currency', currency: 'VND' })}
                    {order.status === 'active' && (
                      <div className="text-xs text-blue-600 mt-1">
                        {order.timeRemaining > 0 ? `${order.timeRemaining}s còn lại` : 'Đang xử lý'}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {order.time ? format(new Date(order.time), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                    {order.status === 'active' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${order.sessionProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.status === 'completed' ? (
                      <Badge variant={order.isWin ? 'default' : 'secondary'} className={cn({
                        'bg-green-100 text-green-800 hover:bg-green-100': order.isWin,
                        'bg-red-100 text-red-800 hover:bg-red-100': !order.isWin
                      })}>
                        {order.isWin ? 'Thắng' : 'Thua'}
                      </Badge>
                    ) : order.status === 'active' ? (
                      <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        Đang diễn ra
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-200 text-blue-600">
                        Đang chờ
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">{orderHistoryData.length} kết quả</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="bg-blue-600 text-white">
            1
          </Button>
          <Button variant="outline" size="sm">
            2
          </Button>
          <Button variant="outline" size="sm">
            3
          </Button>
          <Button variant="outline" size="sm">
            4
          </Button>
          <Button variant="outline" size="sm">
            5
          </Button>
          <Button variant="outline" size="sm">
            ...
          </Button>
          <Button variant="outline" size="sm">
            73
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

const TradingSessionsPage = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const sessionsPerPage = 10
  const [allSessions, setAllSessions] = useState<TradingSession[]>(() => generateSessions())
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
                  'text-green-600': currentSession?.result === 'Lên',
                  'text-red-600': currentSession?.result === 'Xuống'
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
                          variant={session.result === 'Lên' ? 'default' : 'destructive'}
                          className={cn({
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
                      variant={session.result === "Lên" ? "default" : "destructive"}
                      className={
                        session.result === "Lên"
                          ? "bg-green-500 text-white hover:bg-green-500"
                          : "bg-red-500 text-white hover:bg-red-500"
                      }
                    >
                      {session.result}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{format(session.startTime, 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                  <TableCell className="text-gray-600">{format(session.endTime, 'dd/MM/yyyy HH:mm:ss')}</TableCell>
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
  const [customerFilter, setCustomerFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const withdrawalData = [
    {
      time: "29/06/2025 14:56:11",
      customer: "Nguyễn Thu Mai",
      amount: "600,000đ",
      receivedAmount: "570,000đ",
      bank: "LPBANK",
      accountNumber: "051606050001",
      accountHolder: "Nguyễn Thu Mai",
      status: "Chờ duyệt",
    },
    {
      time: "29/06/2025 14:54:26",
      customer: "Nguyễn Thu Mai",
      amount: "100,000đ",
      receivedAmount: "95,000đ",
      bank: "LPBANK",
      accountNumber: "051606050001",
      accountHolder: "Nguyễn Thu Mai",
      status: "Từ chối",
    },
    {
      time: "29/06/2025 13:15:56",
      customer: "nguyenthuy1983",
      amount: "600,000đ",
      receivedAmount: "570,000đ",
      bank: "BIDV",
      accountNumber: "3600688224",
      accountHolder: "Nguyễn thị Hồng Thúy",
      status: "Chờ duyệt",
    },
    {
      time: "29/06/2025 12:29:56",
      customer: "Hangpham1991",
      amount: "510,000đ",
      receivedAmount: "484,500đ",
      bank: "Vietinbank",
      accountNumber: "102877186224",
      accountHolder: "Phạm Thị Thanh Hằng",
      status: "Chờ duyệt",
    },
    {
      time: "28/06/2025 23:00:32",
      customer: "Đinh Thị Tú Anh 1969",
      amount: "5,000,000đ",
      receivedAmount: "4,750,000đ",
      bank: "Vietinbank",
      accountNumber: "104876981067",
      accountHolder: "ĐINH THỊ TÚ ANH",
      status: "Chờ duyệt",
    },
    {
      time: "28/06/2025 23:00:04",
      customer: "Đinh Thị Tú Anh 1969",
      amount: "5,000,000đ",
      receivedAmount: "4,750,000đ",
      bank: "Vietinbank",
      accountNumber: "104876981067",
      accountHolder: "ĐINH THỊ TÚ ANH",
      status: "Chờ duyệt",
    },
    {
      time: "28/06/2025 22:59:43",
      customer: "Đinh Thị Tú Anh 1969",
      amount: "2,000,000đ",
      receivedAmount: "1,900,000đ",
      bank: "Vietinbank",
      accountNumber: "104876981067",
      accountHolder: "ĐINH THỊ TÚ ANH",
      status: "Chờ duyệt",
    },
    {
      time: "28/06/2025 22:22:34",
      customer: "vuthanhtra",
      amount: "600,000đ",
      receivedAmount: "570,000đ",
      bank: "Ngân hàng quân đội",
      accountNumber: "0912652386",
      accountHolder: "Vũ thị thanh trà",
      status: "Chờ duyệt",
    },
    {
      time: "28/06/2025 20:40:04",
      customer: "ThuThao85",
      amount: "600,000đ",
      receivedAmount: "570,000đ",
      bank: "MB",
      accountNumber: "0334191359",
      accountHolder: "Trần Thị Thu Thảo",
      status: "Đã duyệt",
    },
    {
      time: "28/06/2025 20:02:05",
      customer: "Vythao123",
      amount: "600,000đ",
      receivedAmount: "570,000đ",
      bank: "Vietinbank",
      accountNumber: "107004415214",
      accountHolder: "Dương Ngọc nương",
      status: "Đã duyệt",
    },
  ]

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Home className="h-4 w-4" />
        <span>/</span>
        <span>Yêu cầu rút tiền</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Label>Khách hàng</Label>
          <Input
            placeholder="Khách hàng"
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="w-48"
          />
        </div>
        <div className="flex items-center gap-2">
          <Label>Trạng thái</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="pending">Chờ duyệt</SelectItem>
              <SelectItem value="approved">Đã duyệt</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Label>Thời gian</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          <span>-</span>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
        </div>
        <Button variant="outline" size="sm">
          Đặt lại
        </Button>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          Áp dụng
        </Button>
      </div>

      {/* Withdrawal Requests Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Khách hàng</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Số tiền nhận</TableHead>
                <TableHead>Ngân hàng nhận tiền</TableHead>
                <TableHead>Số tài khoản</TableHead>
                <TableHead>Chủ tài khoản</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {withdrawalData.map((withdrawal, index) => (
                <TableRow key={index}>
                  <TableCell>{withdrawal.time}</TableCell>
                  <TableCell className="text-teal-500">{withdrawal.customer}</TableCell>
                  <TableCell>{withdrawal.amount}</TableCell>
                  <TableCell>{withdrawal.receivedAmount}</TableCell>
                  <TableCell>{withdrawal.bank}</TableCell>
                  <TableCell>{withdrawal.accountNumber}</TableCell>
                  <TableCell>{withdrawal.accountHolder}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        withdrawal.status === "Đã duyệt"
                          ? "default"
                          : withdrawal.status === "Từ chối"
                            ? "destructive"
                            : "secondary"
                      }
                      className={
                        withdrawal.status === "Đã duyệt"
                          ? "bg-green-500 text-white hover:bg-green-500"
                          : withdrawal.status === "Từ chối"
                            ? "bg-red-500 text-white hover:bg-red-500"
                            : "bg-blue-500 text-white hover:bg-blue-500"
                      }
                    >
                      {withdrawal.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {withdrawal.status === "Chờ duyệt" ? (
                        <>
                          <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white">
                            Phê duyệt
                          </Button>
                          <Button size="sm" variant="outline" className="text-gray-600 bg-transparent">
                            Từ chối
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="outline" className="text-gray-400 bg-transparent" disabled>
                            Phê duyệt
                          </Button>
                          <Button size="sm" variant="outline" className="text-gray-400 bg-transparent" disabled>
                            Từ chối
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Settings Page Component
function SettingsPage() {
  const [bankName, setBankName] = useState("ABBANK")
  const [accountNumber, setAccountNumber] = useState("0387473721")
  const [accountHolder, setAccountHolder] = useState("VU VAN MIEN")
  const [minDeposit, setMinDeposit] = useState("100,000")
  const [minWithdrawal, setMinWithdrawal] = useState("100,000")
  const [maxWithdrawal, setMaxWithdrawal] = useState("100,000")
  const [cskh, setCskh] = useState("https://t.me/DICHVUCSKHLS")

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

function generateSessions(baseTimestamp: string = ''): TradingSession[] {
  const sessions: TradingSession[] = [];
  let startTime: Date;
  
  if (baseTimestamp && baseTimestamp.length === 12) {
    // Use the provided timestamp as the base time
    startTime = parseTimestamp(baseTimestamp);
  } else {
    // Default to current time if no valid timestamp is provided
    startTime = new Date();
  }
  
  // Generate 5 sessions per day (every 2 hours from 9:00 to 17:00)
  for (let i = 0; i < 7; i++) {
    const date = new Date(startTime);
    date.setDate(startTime.getDate() + i);
    
    for (let j = 0; j < 5; j++) {
      startTime.setHours(9 + (j * 2), 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 2);
      
      // Determine session status based on current time
      let status: 'upcoming' | 'active' | 'completed';
      const currentTime = new Date();
      
      if (currentTime > endTime) {
        status = 'completed';
      } else if (currentTime >= startTime && currentTime <= endTime) {
        status = 'active';
      } else {
        status = 'upcoming';
      }
      
      // Format session ID as YYYYMMDDHHmm-HHmm
      const sessionId = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}${String(9 + j * 2).padStart(2, '0')}00`;
      
      sessions.push({
        id: sessionId,
        startTime,
        endTime,
        status,
        result: Math.random() > 0.5 ? 'Tăng' : 'Giảm',
        session: `Phiên ${j + 1} (${9 + j * 2}:00 - ${11 + j * 2}:00)`,
        progress: status === 'completed' ? 100 : status === 'active' ? Math.floor(Math.random() * 100) : 0
      });
    }
  }
  
  return sessions;
}
