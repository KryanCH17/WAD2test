<template>
    <div class="modal fade" id="uploadModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Add an item to marketplace!</h5>
                    <button type="button" class="btn-close" @click="closeModal"></button>
                </div>
                <div class="modal-body">
                    <form @submit.prevent="handleSubmit">
                        <div class="mb-3">
                            <label for="itemName" class="form-label">Item Name</label>
                            <input type="text" class="form-control" v-model="itemName" placeholder="Enter item name" required>
                        </div>
                        <div class="mb-3">
                            <label for="itemImage" class="form-label">Upload Item Image</label>
                            <input type="file" class="form-control" @change="handleFileChange" accept="image/*" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100">Post</button>
                    </form>
                    <div v-if="status" class="mt-3">{{ status }}</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export default {
    data() {
        return {
            itemName: '',
            file: null,
            status: ''
        };
    },
    methods: {
        closeModal() {
            this.$emit('close');
        },
        handleFileChange(event) {
            this.file = event.target.files[0];
        },
        async handleSubmit() {
            if (this.itemName && this.file) {
                this.status = "Uploading post...";

                const auth = getAuth();
                const storage = getStorage();
                const db = getFirestore();
                const userDisplayName = auth.currentUser.displayName;
                const userId = auth.currentUser.uid;

                const storageRefPath = storageRef(storage, `posts/${this.file.name}`);
                const uploadTask = uploadBytesResumable(storageRefPath, this.file);

                uploadTask.on('state_changed',
                    null,
                    (error) => {
                        console.error("Error uploading image:", error);
                        this.status = "Error uploading image.";
                    },
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        try {
                            await addDoc(collection(db, 'posts'), {
                                itemName: this.itemName,
                                imageUrl: downloadURL,
                                account: userDisplayName,
                                uid: userId,
                                timestamp: new Date()
                            });
                            this.status = "Post created successfully!";
                            this.resetForm();
                            this.closeModal();
                        } catch (error) {
                            console.error("Error saving post:", error);
                            this.status = "Error creating post.";
                        }
                    }
                );
            } else {
                this.status = "Please fill in all fields.";
            }
        },
        resetForm() {
            this.itemName = '';
            this.file = null;
            this.status = '';
        }
    }
};
</script>

<style scoped>
.modal-content {
    max-width: 600px;
    margin: auto;
}
</style>
