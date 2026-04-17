import Navbar from "../../components/Lecturer/Navbar";
import ChatBotWidget from "../../components/ChatBot/ChatBotWidget";

const LecturerLayout = ({ children }: { children: any }) => {
    return (
        <div className="wrapper">
            <Navbar />
            {/*<Sidebar />*/}
            <div className="content-wrapper">
                {children}
            </div>
            <ChatBotWidget />
        </div>
    );
}

export default LecturerLayout;