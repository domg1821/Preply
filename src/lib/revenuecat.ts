"use client";

/**
 * RevenueCat Capacitor integration for Preply.
 * All exports dynamically import @revenuecat/purchases-capacitor so the
 * module is never bundled into the web build. Call these only when isNative() is true.
 *
 * Entitlement: "premium"
 * Product IDs (set these in App Store Connect AND RevenueCat dashboard):
 *   Monthly: com.preply.premium.monthly
 *   Yearly:  com.preply.premium.yearly
 */

export const RC_ENTITLEMENT = "premium";
export const RC_PRODUCT_MONTHLY = "com.preply.premium.monthly";
export const RC_PRODUCT_YEARLY  = "com.preply.premium.yearly";

export interface RCPackage {
  identifier: string;
  packageType: string;
  product: {
    title: string;
    description: string;
    priceString: string;
    currencyCode: string;
    price: number;
  };
  _raw: unknown;
}

export interface RCOffering {
  monthly: RCPackage | null;
  yearly:  RCPackage | null;
}

export async function configureRevenueCat(appUserId: string): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY;
  if (!apiKey) {
    console.warn("[revenuecat] NEXT_PUBLIC_REVENUECAT_IOS_API_KEY not set");
    return;
  }
  const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
  await Purchases.setLogLevel({ level: LOG_LEVEL.ERROR });
  await Purchases.configure({ apiKey, appUserID: appUserId });
}

export async function getOffering(): Promise<RCOffering> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const offeringsResult = await Purchases.getOfferings();
  const current = (offeringsResult as unknown as { current: unknown }).current;
  if (!current) return { monthly: null, yearly: null };

  const currentOffering = current as { availablePackages?: unknown[] };

  const toPackage = (pkg: unknown): RCPackage | null => {
    if (!pkg) return null;
    const p = pkg as Record<string, unknown>;
    const product = p.product as Record<string, unknown>;
    return {
      identifier: String(p.identifier ?? ""),
      packageType: String(p.packageType ?? ""),
      product: {
        title:        String(product?.title ?? ""),
        description:  String(product?.description ?? ""),
        priceString:  String(product?.priceString ?? ""),
        currencyCode: String(product?.currencyCode ?? "USD"),
        price:        Number(product?.price ?? 0),
      },
      _raw: pkg,
    };
  };

  const pkgs = (currentOffering.availablePackages ?? []) as unknown[];
  const monthly = pkgs.find((p) => {
    const pkg = p as Record<string, unknown>;
    return String(pkg.packageType).toLowerCase().includes("monthly") ||
           String(pkg.identifier).includes("monthly");
  });
  const yearly = pkgs.find((p) => {
    const pkg = p as Record<string, unknown>;
    return String(pkg.packageType).toLowerCase().includes("annual") ||
           String(pkg.packageType).toLowerCase().includes("yearly") ||
           String(pkg.identifier).includes("yearly");
  });

  return { monthly: toPackage(monthly), yearly: toPackage(yearly) };
}

export type PurchaseResult =
  | { success: true; customerInfo: unknown }
  | { success: false; cancelled: boolean; error: string };

export async function purchasePackage(pkg: RCPackage): Promise<PurchaseResult> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  try {
    const result = await Purchases.purchasePackage({ aPackage: pkg._raw as never });
    return { success: true, customerInfo: result.customerInfo };
  } catch (err) {
    const e = err as Record<string, unknown>;
    const cancelled = e?.userCancelled === true;
    return {
      success: false,
      cancelled,
      error: String(e?.message ?? "Purchase failed. Please try again."),
    };
  }
}

export async function restorePurchases(): Promise<{ isPremium: boolean }> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.restorePurchases();
  const info = customerInfo as unknown as { entitlements: { active: Record<string, unknown> } };
  return { isPremium: RC_ENTITLEMENT in (info?.entitlements?.active ?? {}) };
}

export async function checkEntitlement(): Promise<boolean> {
  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const { customerInfo } = await Purchases.getCustomerInfo();
  const info = customerInfo as unknown as { entitlements: { active: Record<string, unknown> } };
  return RC_ENTITLEMENT in (info?.entitlements?.active ?? {});
}
