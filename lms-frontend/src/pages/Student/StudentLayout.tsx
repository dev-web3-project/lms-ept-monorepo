import Navbar from "../../components/Student/Navbar";
import ChatBotWidget from "../../components/ChatBot/ChatBotWidget";

const StudentLayout = ({ children }: { children: any }) => {
    return (
        <div className="wrapper">
            <Navbar />
            <div className="content-wrapper">
                {children}
            </div>
            <ChatBotWidget />
        </div>
    );
}

export default StudentLayout;