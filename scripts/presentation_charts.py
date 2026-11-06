import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
import os
OUT=os.path.join(os.path.dirname(__file__),"..","docs","img")+os.sep
yrs=[1,2,3,4,5]; buy=[366,456,576,725,912]; build=[553,319,402,486,569]
fig,ax=plt.subplots(figsize=(8,4.2),dpi=150)
ax.plot(yrs,buy,marker="o",lw=2.5,color="#d9534f",label="Stay on Power Apps")
ax.plot(yrs,build,marker="o",lw=2.5,color="#2b7bba",label="Build with Devin")
for x,b,d in zip(yrs,buy,build):
    ax.annotate(f"${b}K",(x,b),textcoords="offset points",xytext=(0,8),ha="center",fontsize=8,color="#d9534f")
    ax.annotate(f"${d}K",(x,d),textcoords="offset points",xytext=(0,-15),ha="center",fontsize=8,color="#2b7bba")
ax.axvspan(0.7,1.3,color="#f0ad4e",alpha=.15); ax.text(1,880,"Year 1: paying for both",ha="center",fontsize=8,color="#8a5a00")
ax.set_xticks(yrs,[f"Year {y}" for y in yrs]); ax.set_ylabel("Annual cost ($K)"); ax.set_ylim(0,980)
ax.set_title("Annual cost, base case (30% ops headcount growth)",fontsize=11)
ax.spines[["top","right"]].set_visible(False); ax.legend(frameon=False,loc="lower right"); ax.grid(axis="y",alpha=.3)
fig.tight_layout(); fig.savefig(OUT+"cost-annual.png")
sc=["Flat headcount\n(0%)","15% growth","30% growth\n(base case)","50% growth"]; v=[303,-131,-706,-1740]
fig,ax=plt.subplots(figsize=(8,3.8),dpi=150)
cols=["#d9534f" if x>0 else "#2b7bba" for x in v]
bars=ax.bar(sc,v,color=cols)
for b,x in zip(bars,v):
    lbl=(f"Power Apps cheaper\nby ${x}K" if x>0 else (f"Build saves\n${-x/1000:.2f}M" if x<=-1000 else f"Build saves\n${-x}K"))
    ax.annotate(lbl,(b.get_x()+b.get_width()/2,x),textcoords="offset points",xytext=(0,6 if x>0 else -28),ha="center",fontsize=8)
ax.axhline(0,color="#333",lw=.8); ax.set_ylim(-2350,600)
ax.set_ylabel("5-year build − buy ($K)"); ax.set_title("It depends on headcount growth: 5-year difference",fontsize=11)
ax.spines[["top","right"]].set_visible(False); ax.grid(axis="y",alpha=.3)
fig.tight_layout(); fig.savefig(OUT+"cost-sensitivity.png")
print("ok")
