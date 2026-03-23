export declare const dbGet: (query: string, params?: any[]) => Promise<any>;
export declare const dbAll: (query: string, params?: any[]) => Promise<any[]>;
export declare const dbRun: (query: string, params?: any[]) => Promise<any>;
export declare function addLicense(udid: string, deviceName: string, durationDays: number): Promise<any>;
export declare function checkLicense(udid: string): Promise<{
    udid: any;
    deviceName: any;
    expiresAt: any;
    daysRemaining: number;
} | null>;
export declare function renewLicense(udid: string, durationDays: number): Promise<any>;
export declare function getAllLicenses(): Promise<any[]>;
export declare function deleteLicense(udid: string): Promise<any>;
export declare function logAction(udid: string, action: string, status: string): Promise<void>;
export declare function getLogs(limit?: number): Promise<any[]>;
export declare function cleanupExpiredLicenses(): Promise<any>;
//# sourceMappingURL=db.d.ts.map