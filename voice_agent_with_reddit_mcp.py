import logging
import os
from dotenv import load_dotenv
from google.genai import types

from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli, mcp
from livekit.plugins import deepgram, google, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

logger = logging.getLogger("reddit-mcp-voice-agent")

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
    Main entrypoint for the voice agent with Reddit & GitHub MCP integration.
    
    This creates an AgentSession with:
    - Voice activity detection (VAD)
    - Speech-to-text (STT) 
    - Large language model (LLM)
    - Text-to-speech (TTS)
    - Reddit & GitHub MCP servers for comprehensive data access
    """
    
    # MCP servers commented out for general sales agent
    # reddit_mcp_server = mcp.MCPServerStdio(
    #     command="/Users/nipurnagarwal/.local/bin/uv",
    #     args=[
    #         "--directory",
    #         "/Users/nipurnagarwal/Desktop/reddit-mcp",
    #         "run",
    #         "server.py"
    #     ],
    #     env={
    #         "REDDIT_CLIENT_ID": "RfKlqqJYjYyqZ_uG2Q4sxg",
    #         "REDDIT_CLIENT_SECRET": "7V8_rf8X6PvrFcHt0OC08PEVIhkjXw", 
    #         "REDDIT_USERNAME": "Nipurn_1234",
    #         "REDDIT_PASSWORD": "nipurn@123"
    #     }
    # )

    # github_mcp_server = mcp.MCPServerStdio(
    #     command="npx",
    #     args=[
    #         "-y",
    #         "@modelcontextprotocol/server-github"
    #     ],
    #     env={
    #         "GITHUB_PERSONAL_ACCESS_TOKEN": os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
    #     }
    # )

    # Create AgentSession for 100X Prompt Sales Agent with Google Search
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
        # mcp_servers=[reddit_mcp_server, github_mcp_server],  # MCP servers commented out
    )

    # Start the agent session
    await session.start(agent=HundredXPromptSalesAgent(), room=ctx.room)


# Example usage scenarios for 100X Prompt Sales Agent:
"""
During a sales call, the 100X Prompt Sales Agent can:

WEB SEARCH CAPABILITIES:
1. "Can you research [Company Name] and their current challenges?"
   - Agent searches for recent company news, press releases, and industry reports
   - Identifies growth challenges and potential pain points

2. "What's happening in the [Industry] space right now?"
   - Agent finds current industry trends and market developments
   - Discovers opportunities for AI automation and prompt engineering

3. "Look up information about our competitor [Competitor Name]"
   - Agent researches competitor offerings and market positioning
   - Identifies differentiation opportunities for 100X Prompt

4. "Find recent news about AI adoption in [Industry]"
   - Agent searches for AI implementation trends and success stories
   - Builds compelling case studies and ROI examples

SALES CONVERSATION EXAMPLES:
5. "Based on your company's recent expansion, how can 100X Prompt help scale your operations?"
   - Uses web research to understand company context
   - Tailors pitch to specific business situation

6. "I see your industry is facing [specific challenge]. Here's how our clients achieved 100x improvements..."
   - Leverages real-time market intelligence
   - Provides data-driven solution recommendations

The agent combines web research with consultative selling to deliver personalized, value-driven sales conversations.
"""


if __name__ == "__main__":
    # Run the 100X Prompt Sales Agent with Google Search
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))