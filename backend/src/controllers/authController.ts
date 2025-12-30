import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { supabase } from '../services/supabaseClient';
import { WithAuthProp } from '@clerk/clerk-sdk-node';

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const userId = (req as WithAuthProp<Request>).auth.userId;
        const { role, code, department, year, section } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        if (!['student', 'faculty', 'admin'].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        // Verify Access Codes for Privileged Roles
        if (role === 'admin') {
            if (code !== process.env.ADMIN_SECRET) {
                return res.status(403).json({ error: "Invalid Admin Access Code" });
            }
        }

        if (role === 'faculty') {
            if (code !== process.env.FACULTY_SECRET) {
                return res.status(403).json({ error: "Invalid Faculty Access Code" });
            }
        }

        // Update Clerk Metadata
        await clerkClient.users.updateUser(userId, {
            publicMetadata: { role: role }
        });

        // Sync with Supabase Profile
        // Construct update object dynamically to allow partial updates if needed
        const profileUpdate: any = { role };
        if (department) profileUpdate.department = department;
        if (year) profileUpdate.year = year;
        if (section) profileUpdate.section = section;

        await supabase.from('profiles').update(profileUpdate).eq('id', userId);

        res.status(200).json({ message: "Role updated successfully", role });
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Failed to update role" });
    }
};

export const syncUser = async (req: Request, res: Response) => {
    try {
        const userId = (req as WithAuthProp<Request>).auth.userId;
        const { email, fullName, avatarUrl } = req.body;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Check if profile exists
        const { data: profile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profile) {
            // Profile exists, return it (source of truth for role)
            // Optionally update email/name/avatar if they changed in Clerk?
            // For now, let's just return the existing DB role
            return res.json(profile);
        }

        // Profile doesn't exist (First Login)
        // Default role is 'student' (handled by DB default, but we can be explicit)
        const newProfile = {
            id: userId,
            email,
            full_name: fullName,
            avatar_url: avatarUrl,
            role: 'student' // Default
        };

        const { data: createdProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .single();

        if (insertError) {
            console.error("Supabase Insert Error:", insertError);
            throw insertError;
        }

        res.json(createdProfile);

    } catch (error) {
        console.error("Error syncing user:", error);
        res.status(500).json({ error: "Failed to sync user" });
    }
};
