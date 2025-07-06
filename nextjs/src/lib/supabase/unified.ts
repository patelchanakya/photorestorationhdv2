import {SupabaseClient} from "@supabase/supabase-js";
import {Database} from "@/lib/types";

export enum ClientType {
    SERVER = 'server',
    SPA = 'spa'
}

export class SassClient {
    private client: SupabaseClient<Database>;
    private clientType: ClientType;

    constructor(client: SupabaseClient, clientType: ClientType) {
        this.client = client;
        this.clientType = clientType;

    }

    async loginEmail(email: string, password: string) {
        return this.client.auth.signInWithPassword({
            email: email,
            password: password
        });
    }

    async registerEmail(email: string, password: string) {
        return this.client.auth.signUp({
            email: email,
            password: password
        });
    }

    async exchangeCodeForSession(code: string) {
        return this.client.auth.exchangeCodeForSession(code);
    }

    async resendVerificationEmail(email: string) {
        return this.client.auth.resend({
            email: email,
            type: 'signup'
        })
    }

    async logout() {
        const { error } = await this.client.auth.signOut({
            scope: 'local'
        });
        if (error) throw error;
        if(this.clientType === ClientType.SPA) {
            window.location.href = '/auth/login';
        }
    }

    async uploadFile(myId: string, filename: string, file: File) {
        // Clean the original filename
        const cleanedFilename = filename.replace(/[^0-9a-zA-Z!\-_.*'()]/g, '_');
        
        // Add timestamp to prevent overwrites
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
        const fileExtension = cleanedFilename.split('.').pop();
        const nameWithoutExtension = cleanedFilename.replace(`.${fileExtension}`, '');
        const uniqueFilename = `${nameWithoutExtension}_${timestamp}.${fileExtension}`;
        
        const fullPath = myId + "/" + uniqueFilename;
        return this.client.storage.from('files').upload(fullPath, file);
    }


    async getFiles(myId: string) {
        // Force cache busting with timestamp
        const timestamp = Date.now();
        console.log(`[FILES DEBUG] getFiles called at ${timestamp} for user ${myId}`);
        
        const result = await this.client.storage.from('files').list(myId, {
            sortBy: { column: 'created_at', order: 'desc' }
        });
        
        console.log(`[FILES DEBUG] getFiles result:`, result.data?.length || 0, 'files found');
        if (result.error) {
            console.error(`[FILES DEBUG] getFiles error:`, result.error);
        }
        
        return result;
    }

    async deleteFile(myId: string, filename: string) {
        filename = myId + "/" + filename
        return this.client.storage.from('files').remove([filename])
    }

    async shareFile(myId: string, filename: string, timeInSec: number, forDownload: boolean = false, bucket: string = 'files') {
        filename = myId + "/" + filename
        return this.client.storage.from(bucket).createSignedUrl(filename, timeInSec, {
            download: forDownload,
            transform: {
                // Add cache headers for better browser caching
                // This reduces egress costs by caching images in browser
                quality: 80 // Optimize quality for web viewing
            }
        });
    }

    async shareRestoredImage(filePath: string, timeInSec: number, forDownload: boolean = false) {
        return this.client.storage.from('restored-images').createSignedUrl(filePath, timeInSec, {
            download: forDownload,
            transform: {
                // Optimize restored images for web viewing
                // These are final results, so maintain higher quality
                quality: 90
            }
        });
    }

    async getMyTodoList(page: number = 1, pageSize: number = 100, order: string = 'created_at', done: boolean | null = false) {
        let query = this.client.from('todo_list').select('*').range(page * pageSize - pageSize, page * pageSize - 1).order(order)
        if (done !== null) {
            query = query.eq('done', done)
        }
        return query
    }

    async createTask(row: Database["public"]["Tables"]["todo_list"]["Insert"]) {
        return this.client.from('todo_list').insert(row)
    }

    async removeTask (id: number) {
        return this.client.from('todo_list').delete().eq('id', id)
    }

    async updateAsDone (id: number) {
        return this.client.from('todo_list').update({done: true}).eq('id', id)
    }

    getSupabaseClient() {
        return this.client;
    }


}
