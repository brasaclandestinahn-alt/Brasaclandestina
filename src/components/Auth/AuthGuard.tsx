"use client";
import React from "react";
import { Role } from "@/lib/mockDB";

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
}

export default function AuthGuard({ children }: AuthGuardProps) {
    return <>{children}</>;
}

