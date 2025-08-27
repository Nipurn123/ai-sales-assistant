import logging
import os
from dotenv import load_dotenv
from google.genai import types

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, mcp
from livekit.plugins import deepgram, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("room-voice-agent")
load_dotenv()


class HundredXPromptSalesAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are the 100X Prompt Sales Agent - an elite AI sales representative with web search capabilities. "
                "You work for 100X Prompt, a cutting-edge AI prompt engineering company that helps businesses "
                "achieve 100x productivity gains through advanced prompt strategies.\n"
                "\n"
                "Your capabilities:\n"
                "- Search the web for real-time market information and competitor analysis\n"
                "- Conduct prospect research using live web data\n"
                "- Find current industry trends and news\n"
                "- Research company backgrounds and recent developments\n"
                "- Analyze market opportunities and pain points\n"
                "\n"
                "Your sales approach:\n"
                "- Always be consultative and value-driven\n"
                "- Focus on ROI and productivity gains (100x improvements)\n"
                "- Use data-driven insights from web research\n"
                "- Identify specific pain points and provide tailored solutions\n"
                "- Build trust through expertise and genuine problem-solving\n"
                "\n"
                "100X Prompt Services:\n"
                "- Custom prompt engineering for businesses\n"
                "- AI workflow optimization\n"
                "- Enterprise AI training and consulting\n"
                "- Automated content generation systems\n"
                "- AI-powered customer service solutions\n"
                "\n"
                "Always position 100X Prompt as the premium solution for businesses ready to transform with AI."
            ),
        )

    async def on_enter(self):
        # Greet the user as a professional sales representative
        await self.session.generate_reply(
            instructions=(
                "Greet the caller professionally as a 100X Prompt Sales Agent. "
                "Introduce yourself warmly, mention you have access to real-time market data through web search, "
                "and ask how you can help them achieve 100x productivity gains with AI prompt engineering today."
            )
        )


async def entrypoint(ctx: JobContext):
    """
    Main entrypoint for room-based voice agent connections.
    This will automatically connect to any room that needs the agent.
    """
    await ctx.connect()
    logger.info(f"100X Prompt Sales Agent connecting to room: {ctx.room.name}")
    
    # Configure GitHub MCP server using your existing configuration
    github_mcp_server = mcp.MCPServerStdio(
        command="npx",
        args=[
            "-y",
            "@modelcontextprotocol/server-github"
        ],
        env={
            "GITHUB_PERSONAL_ACCESS_TOKEN": os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
        }
    )
    
    # Create AgentSession for 100X Prompt Sales Agent with Google Search and GitHub MCP
    session = AgentSession(
        vad=silero.VAD.load(),
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=google.beta.realtime.RealtimeModel(
            model="gemini-live-2.5-flash-preview",
            voice="Puck",
            temperature=0.8,
            _gemini_tools=[types.GoogleSearch()]
        ),  # Using Gemini Live API with human-like voice and Google Search
        tts=deepgram.TTS(),  # Using Deepgram TTS
        turn_detection=MultilingualModel(),
        mcp_servers=[github_mcp_server],  # GitHub MCP server for technical analysis
    )

    # Start the agent session
    await session.start(agent=HundredXPromptSalesAgent(), room=ctx.room)
    logger.info(f"100X Prompt Sales Agent started successfully in room: {ctx.room.name}")


if __name__ == "__main__":
    # Run the 100X Prompt Sales Agent for room connections
    logger.info("Starting 100X Prompt Sales Agent for LiveKit room connections...")
    cli.run_app(
        WorkerOptions(
            entrypoint_fnc=entrypoint,
        )
    )