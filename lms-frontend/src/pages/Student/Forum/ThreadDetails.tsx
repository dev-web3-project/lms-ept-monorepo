import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
    getForumThreadById, 
    createForumPost, 
    upvoteThread, 
    upvotePost 
} from "../../../services/api/course";
import { useAuth } from "../../../services/AuthContext";
import { getStudentDetailsByUsername, getLecturerDetailsByUsername } from "../../../services/api/user";
import PageLoading from "../../../components/Admin/PageLoading";

const ThreadDetails = () => {
    const { id, threadId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [thread, setThread] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [newPost, setNewPost] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [fullName, setFullName] = useState('');

    const fetchThread = async () => {
        setLoading(true);
        try {
            if (threadId) {
                const threadData = await getForumThreadById(threadId, user.username);
                setThread(threadData);
            }
        } catch (error) {
            console.error("Error fetching thread:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchThread();
        fetchCurrentUserFullName();
    }, [threadId]);

    const fetchCurrentUserFullName = async () => {
        if (!user?.username) return;
        try {
            const role = localStorage.getItem('role');
            let details: any;
            if (role === 'ROLE_STUDENT') {
                details = await getStudentDetailsByUsername(user.username);
            } else if (role === 'ROLE_LECTURER') {
                details = await getLecturerDetailsByUsername(user.username);
            }
            if (details?.fullName) {
                setFullName(details.fullName);
            } else {
                setFullName(user.username);
            }
        } catch (e) {
            setFullName(user.username);
        }
    };

    const handleReply = async (e: any) => {
        e.preventDefault();
        if (!newPost.trim() || !user || !thread) return;

        setSubmitting(true);
        try {
            const postData = {
                content: newPost,
                authorId: user.username,
                authorName: fullName || user.username,
                threadId: thread.id,
                parentPostId: null
            };
            await createForumPost(postData);
            setNewPost('');
            fetchThread(); // Refresh thread to show new post
        } catch (error) {
            console.error("Error creating post:", error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpvoteThread = async () => {
        if (user && thread) {
            try {
                await upvoteThread(thread.id.toString(), user.username);
                fetchThread();
            } catch (error) {
                console.error("Error upvoting thread:", error);
            }
        }
    };

    const handleUpvotePost = async (postId: number) => {
        if (user) {
            try {
                await upvotePost(postId.toString(), user.username);
                fetchThread();
            } catch (error) {
                console.error("Error upvoting post:", error);
            }
        }
    };

    const handleReplyToPost = async (parentPostId: string, content: string) => {
        if (!content.trim() || !user || !thread) return;

        try {
            const postData = {
                content: content,
                authorId: user.username,
                authorName: fullName || user.username,
                threadId: thread.id,
                parentPostId: parentPostId
            };
            await createForumPost(postData);
            fetchThread(); // Refresh thread to show new reply
        } catch (error) {
            console.error("Error creating reply:", error);
        }
    };

    if (loading) return <PageLoading />;

    return (
        <>
            <div className="content-header">
                <div className="container">
                    <div className="row mb-2">
                        <div className="col-sm-6 d-flex align-items-center">
                            <button 
                                onClick={() => navigate(localStorage.getItem('role') === 'LECTURER' ? `/lecturer/${id}` : `/student/${id}`, { state: { activeTab: 'forum' } })}
                                className="btn btn-tool mr-2"
                                style={{ fontSize: '1.2rem', color: '#6c757d' }}
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                            <h1 className="m-0">{thread?.title}</h1>
                        </div>
                        <div className="col-sm-6">
                            <ol className="breadcrumb float-sm-right">
                                <li className="breadcrumb-item">
                                    <Link to={localStorage.getItem('role') === 'ROLE_LECTURER' ? `/lecturer/${id}` : `/student/${id}`}>
                                        Module
                                    </Link>
                                </li>
                                <li className="breadcrumb-item">
                                    <Link to={localStorage.getItem('role') === 'ROLE_LECTURER' ? `/lecturer/${id}/forum` : `/student/${id}/forum`}>
                                        Forum
                                    </Link>
                                </li>
                                <li className="breadcrumb-item active">Discussion</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>

            <div className="content">
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            {/* Thread original post */}
                            <div className="card card-outline card-primary mb-3">
                                <div className="card-header">
                                    <div className="d-flex justify-content-between align-items-center">
                                        <h3 className="card-title mb-0">
                                            <i className="fas fa-user mr-2"></i>
                                            {thread?.authorName}
                                        </h3>
                                        <div className="d-flex align-items-center">
                                            <button 
                                                className="btn btn-sm btn-outline-primary mr-3"
                                                onClick={handleUpvoteThread}
                                            >
                                                <i className="fas fa-thumbs-up mr-1"></i>
                                                {thread?.upvoteCount || 0}
                                            </button>
                                            <small className="text-muted">
                                                {thread?.createdAt && new Date(thread.createdAt).toLocaleString('fr-FR')}
                                            </small>
                                        </div>
                                    </div>
                                </div>
                                <div className="card-body">
                                    <p className="mb-0">{thread?.content}</p>
                                    {thread?.tag && (
                                        <span className="badge badge-info mt-2">{thread.tag}</span>
                                    )}
                                </div>
                            </div>

                            {/* Posts/Replies */}
                            {thread?.posts && thread.posts.length > 0 && (
                                <div className="card card-outline card-secondary mb-3">
                                    <div className="card-header">
                                        <h3 className="card-title">
                                            <i className="fas fa-comments mr-2"></i>
                                            Réponses ({thread.posts.length})
                                        </h3>
                                    </div>
                                    <div className="card-body p-0">
                                        <div className="list-group list-group-flush">
                                            {thread.posts
                                                .filter((post: any) => !post.parentPostId) // Only top-level posts
                                                .map((post: any) => (
                                                    <div key={post.id} className="list-group-item">
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div style={{ flex: 1 }}>
                                                                <div className="d-flex align-items-center mb-2">
                                                                    <strong className="mr-2">{post.authorName}</strong>
                                                                    <small className="text-muted">
                                                                        {post.createdAt && new Date(post.createdAt).toLocaleString('fr-FR')}
                                                                    </small>
                                                                </div>
                                                                <p className="mb-2">{post.content}</p>
                                  <div className="mb-2">
                                      <button 
                                          className="btn btn-xs btn-link text-primary p-0"
                                          onClick={() => handleUpvotePost(post.id)}
                                      >
                                          <i className="fas fa-thumbs-up mr-1"></i>
                                          {post.upvoteCount || 0}
                                      </button>
                                  </div>
                                                                
                                                                {/* Replies to this post */}
                                                                {post.replies && post.replies.length > 0 && (
                                                                    <div className="ml-4 mt-3 pl-3 border-left">
                                                                        {post.replies.map((reply: any) => (
                                                                            <div key={reply.id} className="mb-2">
                                                                                <div className="d-flex align-items-center mb-1">
                                                                                    <strong className="mr-2 text-sm">{reply.authorName}</strong>
                                                                                    <small className="text-muted text-sm">
                                                                                        {reply.createdAt && new Date(reply.createdAt).toLocaleString('fr-FR')}
                                                                                    </small>
                                                                                </div>
                                                                                <p className="mb-0 text-sm">{reply.content}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Reply form */}
                            <div className="card card-outline card-success">
                                <div className="card-header">
                                    <h3 className="card-title">
                                        <i className="fas fa-reply mr-2"></i>
                                        Ajouter une réponse
                                    </h3>
                                </div>
                                <div className="card-body">
                                    <form onSubmit={handleReply}>
                                        <div className="form-group">
                                            <textarea
                                                className="form-control"
                                                rows={4}
                                                value={newPost}
                                                onChange={(e) => setNewPost(e.target.value)}
                                                placeholder="Écrivez votre réponse..."
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="btn btn-success"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <>
                                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                                    Envoi...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-paper-plane mr-2"></i>
                                                    Envoyer
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ThreadDetails;
