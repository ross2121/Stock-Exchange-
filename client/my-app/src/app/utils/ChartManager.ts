import {
    ColorType,
    createChart as createLightWeightChart,
    CrosshairMode,
    ISeriesApi,
    UTCTimestamp
} from "lightweight-charts"
export class ChartManager{
    private candelSeries:ISeriesApi<"Candlestick">;
    private lastUpdateTime:number=0;
    private chart:any;
    private currentBar: {
        open: number | null;
        high: number | null;
        low: number | null;
        close: number | null;
      } = {
        open: null,
        high: null,
        low: null,
        close: null,
      };
    constructor(ref:any,initialdata:any[],layout:{background:string;color:string}){
        const chart=createLightWeightChart(ref,{
            autoSize:true,
            overlayPriceScales:{
                ticksVisible:true,
                borderVisible:true
            },
            crosshair:{
                mode:CrosshairMode.Normal,
            },
            rightPriceScale:{
                visible:true,
                ticksVisible:true,
                entireTextOnly:true
            },
            grid:{
                horzLines:{
                    visible:false,

                },
                vertLines:{
                    visible:false
                },
            },
            layout:{
                background:{
                    type:ColorType.Solid,
                    color:layout.background,
                },
                textColor:"white"
            }
        });
        this.chart=chart;
        this.candelSeries=chart.addCandlestickSeries();
        this.candelSeries.setData(
            initialdata.map((data)=>({
                ...data,
                time:(data.timestamp/1000) as UTCTimestamp
            }))

        )
    }
    public update(updatePrice:any){
        if(!this.lastUpdateTime){
            this.lastUpdateTime=new Date().getTime();
            this.candelSeries.update({
                time:(this.lastUpdateTime/1000)as UTCTimestamp,
                close:updatePrice.close
            })
        }
    }
}