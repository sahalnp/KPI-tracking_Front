import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../ui/table";
import {
    Upload,
    Download,
    FileText,
    CheckCircle,
    AlertTriangle,
    DollarSign,
    Users,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { axiosInstance } from "@/api/axios";
import { logoutAccountant } from "@/lib/logoutApi";
import { useDispatch } from "react-redux";
import { clearUser } from "@/features/UserSlice";
import { LoadingSpinner } from "../ui/spinner";

type DataType = "sales";

export function MonthlyUploads() {
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    // Only sales type is supported now
    const selectedType: DataType = "sales";
    const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);
    const dispatch = useDispatch();

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch initial data when component mounts or type changes
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const { data } = await axiosInstance.get("/accountant/getData", {
                params: {
                    selectedType: "sales",
                    page: 1,
                    limit: 10,
                },
            });
            setUploadedFiles(data.files || []);
            setHasMore(data.hasMore || false);
            setPage(1);
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutAccountant();
                dispatch(clearUser());
                toast.error("Session expired");
            } else {
                toast.error("Failed to load data");
            }
        } finally {
            setLoading(false);
        }
    };
    const handleDownload = async (fileId: string, fileName: string) => {
        alert("sfsdklfjskldjf")
        try {
            const response = await axiosInstance.get(
                `/accountant/download-file/${fileId}`,
                {
                    responseType: "blob", // Important for file download
                }
            );

            // Create a blob from the response
            const blob = new Blob([response.data]);

            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Create a temporary anchor element and trigger download
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success("File downloaded successfully");
        } catch (error: any) {
            console.error("Download error:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutAccountant();
                dispatch(clearUser());
                toast.error("Session expired");
            } else {
                toast.error("Failed to download file");
            }
        }
    };

    const loadMoreData = async () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        try {
            const nextPage = page + 1;
            const { data } = await axiosInstance.get(
                `/accountant/getmoreData`,
                {
                    params: {
                        type: "sales",
                        page: nextPage,
                        limit: 10,
                    },
                }
            );
            setUploadedFiles((prev) => [...prev, ...(data.files || [])]);
            setHasMore(data.hasMore || false);
            setPage(nextPage);
            if (data.files && data.files.length > 0) {
                toast.success(`Loaded ${data.files.length} more files`);
            }
        } catch (error: any) {
            if (error.response?.status === 401) {
                localStorage.removeItem("accesstoken");
                localStorage.removeItem("refreshtoken");
                await logoutAccountant();
                dispatch(clearUser());
                toast.error("Session expired");
            } else {
                toast.error("Failed to load more data");
            }
        } finally {
            setLoadingMore(false);
        }
    };
    function formatFileSize(bytes: any) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
        if (bytes < 1024 * 1024 * 1024)
            return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        handleFiles(files);
    };

    const handleFiles = async (files: File[]) => {
        if (files.length === 0) return;

        const validTypes = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel",
            "text/csv",
        ];

        const invalidFiles = files.filter(
            (file) => !validTypes.includes(file.type)
        );
        if (invalidFiles.length > 0) {
            toast.error(
                `Invalid file type: ${invalidFiles
                    .map((f) => f.name)
                    .join(", ")}`
            );
            return;
        }

        setUploading(true);

        // Only sales upload endpoint
        const uploadEndpoint = "/accountant/upload-data";

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append("file", file);
                formData.append("type", selectedType);

                const { data: result } = await axiosInstance.post(
                    uploadEndpoint,
                    formData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const newFile: any = {
                    id:
                        result.id ||
                        Date.now().toString() +
                            Math.random().toString(36).substr(2, 9),
                    originalname: file.name,
                    uploadedAt: new Date().toISOString(),
                    status:
                        result.errors && result.errors.length > 0
                            ? "error"
                            : "success",
                    size: file.size,
                    type: selectedType,
                    ...(result.errors &&
                        result.errors.length > 0 && { errors: result.errors }),
                };

                setUploadedFiles((prev) => [newFile, ...prev]);

                if (newFile.status === "success") {
                    const monthName = new Date().toLocaleString("default", {
                        month: "long",
                    });
                    const newActivity = {
                        title: `Uploaded ${file.name} for ${monthName}`,
                        time: new Date().toLocaleString(),
                        status: "success",
                    };

                    const existingActivities = JSON.parse(
                        localStorage.getItem("recentActivity") || "[]"
                    );
                    const updatedActivities = [
                        newActivity,
                        ...existingActivities,
                    ].slice(0, 5);
                    localStorage.setItem(
                        "recentActivity",
                        JSON.stringify(updatedActivities)
                    );

                    toast.success(`${file.name} uploaded successfully`);
                } else {
                    toast.error(`${file.name} uploaded with validation errors`);
                }
            } catch (error: any) {
                console.error("Upload error:", error);

                if (error.response?.status === 401) {
                    localStorage.removeItem("accesstoken");
                    localStorage.removeItem("refreshtoken");
                    await logoutAccountant();
                    dispatch(clearUser());
                    toast.error("Session expired");
                    setUploading(false);
                    return;
                }

                const errorFile: any = {
                    id:
                        Date.now().toString() +
                        Math.random().toString(36).substr(2, 9),
                    originalname: file.name,
                    uploadedAt: new Date().toISOString(),
                    status: "error",
                    size: file.size,
                    type: selectedType,
                    errors: [
                        error.response?.data?.message ||
                            "Network error or server unavailable",
                    ],
                };

                setUploadedFiles((prev) => [errorFile, ...prev]);
                toast.error(`${file.name} upload failed`);
            }
        }

        setUploading(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "success":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case "error":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            default:
                return <FileText className="h-4 w-4 text-blue-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "success":
                return (
                    <Badge
                        variant="default"
                        className="bg-green-100 text-green-800"
                    >
                        Success
                    </Badge>
                );
            case "error":
                return <Badge variant="destructive">Error</Badge>;
            default:
                return <Badge variant="secondary">Processing</Badge>;
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 pb-20"
        >
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm p-4"
            >
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-semibold text-gray-900">
                        Monthly Uploads
                    </h1>
                </div>
                <p className="text-sm text-gray-600">
                    Upload and manage monthly sales
                </p>
            </motion.div>

            {/* Upload Section */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedType}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Upload className="h-5 w-5" />
                                <span>Upload Sales Files</span>
                            </CardTitle>
                            <CardDescription>
                                Upload Excel (.xlsx) or CSV files containing
                                Sales data
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div
                                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                    dragActive
                                        ? "border-[#FF3F33] bg-red-50"
                                        : "border-gray-300 hover:border-gray-400"
                                }`}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                            >
                                <div className="flex flex-col items-center space-y-4">
                                    <motion.div
                                        animate={{
                                            scale: dragActive ? 1.1 : 1,
                                            y: dragActive ? -5 : 0,
                                        }}
                                        transition={{ duration: 0.2 }}
                                        className={`p-3 rounded-full ${
                                            dragActive
                                                ? "bg-[#FF3F33] text-white"
                                                : "bg-gray-100 text-gray-600"
                                        }`}
                                    >
                                        <Upload className="h-8 w-8" />
                                    </motion.div>

                                    <div>
                                        <p className="text-lg font-medium">
                                            Drag & Drop Sales file here or
                                            Browse
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Accepted: Excel (.xlsx), CSV (.csv)
                                        </p>
                                    </div>

                                    <div className="flex space-x-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            disabled={uploading}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#FF3F33] hover:bg-red-600 text-white h-10 px-4 py-2"
                                        >
                                            {uploading ? (
                                                <motion.span
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    className="flex items-center gap-2"
                                                >
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </motion.span>
                                            ) : (
                                                "Browse Files"
                                            )}
                                        </motion.button>
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleFileInput}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>

            {/* Upload History */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={`history-${selectedType}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload History - Sales</CardTitle>
                            <CardDescription>
                                File upload status and validation results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>File Name</TableHead>
                                            <TableHead>Upload Date</TableHead>
                                            <TableHead>Size</TableHead>

                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        <AnimatePresence>
                                            {uploadedFiles.map(
                                                (file, index) => (
                                                    <motion.tr
                                                        key={file.id}
                                                        initial={{
                                                            opacity: 0,
                                                            x: -20,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            x: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            x: 20,
                                                        }}
                                                        transition={{
                                                            duration: 0.3,
                                                            delay: index * 0.05,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="font-medium">
                                                                    {
                                                                        file.originalname
                                                                    }
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">
                                                            {new Date(
                                                                file.uploadedAt
                                                            ).toLocaleDateString()}
                                                        </TableCell>

                                                        <TableCell className="text-gray-600">
                                                            {formatFileSize(
                                                                file.size
                                                            )}
                                                        </TableCell>

                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                {file.status ===
                                                                    "error" &&
                                                                    file.errors && (
                                                                        <motion.button
                                                                            whileTap={{ scale: 0.95 }}
                                                                            onClick={() => {
                                                                                toast.error(
                                                                                    `Validation Errors:\n${file.errors?.join(
                                                                                        "\n"
                                                                                    )}`
                                                                                );
                                                                            }}
                                                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                                                        >
                                                                            View
                                                                            Errors
                                                                        </motion.button>
                                                                    )}

                                                               <motion.button
  whileTap={{ scale: 0.95 }}
  onClick={() => handleDownload(file.id, file.originalname)}
  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
>
  <Download className="h-4 w-4" />
</motion.button>

                                                            </div>
                                                        </TableCell>
                                                    </motion.tr>
                                                )
                                            )}
                                        </AnimatePresence>
                                    </TableBody>
                                </Table>
                            </div>

                            {uploadedFiles.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-center py-8"
                                >
                                    <p className="text-gray-500">
                                        No {selectedType} files uploaded yet
                                    </p>
                                </motion.div>
                            )}

                            {/* Load More Button */}
                            {uploadedFiles.length > 0 && hasMore && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex justify-center mt-6"
                                >
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={loadMoreData}
                                        disabled={loadingMore}
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 min-w-[200px]"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Loading...
                                            </>
                                        ) : (
                                            "Load More"
                                        )}
                                    </motion.button> 
                                </motion.div>
                            )}

                            {uploadedFiles.length > 0 && !hasMore && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center mt-6"
                                >
                                    <p className="text-sm text-gray-500">
                                        No more files to load
                                    </p>
                                </motion.div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
